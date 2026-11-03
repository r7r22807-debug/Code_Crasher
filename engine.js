'use strict';

const { randomUUID, randomInt } = require('node:crypto');
const POWERS = ['call', 'two', 'pit', 'break', 'trap'];
const DEFAULTS = Object.freeze({
  activeSeconds: 60, opponentSeconds: 10, callSeconds: 0,
  points: [200, 200, 400, 400, 600, 600], enabledPowers: [...POWERS],
  allowSteal: true, negativeScores: true, pitOnSteal: false,
  trapCorrectScores: true, trapTimeoutPenalty: true, nextTurn: 'alternate',
  guestEnabled: true, categoryPreview: true
});

function requireRule(condition, message) {
  if (!condition) throw Object.assign(new Error(message), { status: 400 });
}
function integer(value, min, max) {
  return Number.isSafeInteger(value) && value >= min && value <= max;
}
function uniqueList(value, min, max) {
  return Array.isArray(value) && value.length >= min && value.length <= max &&
    value.every(v => typeof v === 'string') && new Set(value).size === value.length;
}
function validateSettings(input = {}) {
  requireRule(input && typeof input === 'object' && !Array.isArray(input), 'إعدادات غير صالحة');
  const s = structuredClone(DEFAULTS);
  for (const key of Object.keys(s)) {
    if (Object.hasOwn(input, key)) s[key] = structuredClone(input[key]);
    if (typeof DEFAULTS[key] === 'boolean') requireRule(typeof s[key] === 'boolean', 'قيمة الخيار غير صالحة');
  }
  requireRule(integer(s.activeSeconds, 1, 3600) && integer(s.opponentSeconds, 1, 3600) &&
    integer(s.callSeconds, 0, 3600), 'تحقق من مدة المؤقت');
  requireRule(Array.isArray(s.points) && s.points.length === 6 &&
    s.points.every(p => integer(p, 1, 100000)), 'أدخل ست قيم نقاط صحيحة وموجبة');
  requireRule(uniqueList(s.enabledPowers, 3, 5) && s.enabledPowers.every(p => POWERS.includes(p)), 'يجب إتاحة ثلاث وسائل مساعدة مختلفة على الأقل');
  requireRule(['alternate', 'retain', 'winner'].includes(s.nextTurn), 'قاعدة تبديل الدور غير صالحة');
  return s;
}
function published(item) {
  return item && item.status !== 'hidden' && item.status !== 'draft' &&
    (item.status === undefined || item.status === 'published') && item.published !== false;
}
function shuffled(items) {
  const result = [...items];
  for (let end = result.length - 1; end > 0; end--) {
    const other = randomInt(end + 1);
    [result[end], result[other]] = [result[other], result[end]];
  }
  return result;
}
function distributePlayers(players) {
  requireRule(Array.isArray(players) && players.length >= 2 && players.length <= 200, 'أدخل لاعبين على الأقل');
  const mixed = shuffled(players);
  return [mixed.slice(0, Math.ceil(mixed.length / 2)), mixed.slice(Math.ceil(mixed.length / 2))];
}
function prepareTeam(t, available) {
  requireRule(t && typeof t.name === 'string' && t.name.trim() && t.name.trim().length <= 80, 'أدخل اسماً صالحاً لكل فريق');
  requireRule(uniqueList(t.categories, 3, 3), 'اختر ثلاث فئات مختلفة لكل فريق');
  requireRule(uniqueList(t.powers, 3, 3) && t.powers.every(p => available.includes(p)), 'اختر ثلاث وسائل مساعدة متاحة ومختلفة لكل فريق');
  const players = t.players ?? [];
  requireRule(Array.isArray(players) && players.length <= 100 && players.every(p =>
    typeof p === 'string' && p.trim().length > 0 && p.trim().length <= 80), 'تحقق من أسماء اللاعبين');
  return { name: t.name.trim(), categories: [...t.categories], powers: [...t.powers],
    players: players.length ? players.map(p => p.trim()) : ['اللاعب ١'], used: [], score: 0 };
}
function makeBoard(categories, questions, rules, seen) {
  const board = [];
  const assigned = new Set();
  for (const category of categories) {
    const pool = shuffled(questions.filter(q => q.categoryId === category.id && published(q)));
    for (let index = 0; index < 6; index++) {
      const difficulty = ['easy','medium','hard'][Math.floor(index / 2)];
      const tierPoints = DEFAULTS.points[index];
      const candidates = pool.filter(q => !assigned.has(q.id));
      requireRule(candidates.length, 'لا تتوفر ستة أسئلة منشورة ومختلفة في الفئة: ' + category.name);
      const priority = q => (q.difficulty === difficulty || Number(q.points) === tierPoints ? 0 : 2) + Number(seen.has(q.id));
      const selected = candidates.reduce((a, b) => priority(a) <= priority(b) ? a : b);
      assigned.add(selected.id);
      board.push({ id: selected.id, categoryId: category.id, points: rules.points[index],
        status: 'open', question: structuredClone(selected) });
    }
  }
  return board;
}
function createGame(config, categories, questions, settings = {}, now = Date.now()) {
  const rules = validateSettings(settings);
  requireRule(Array.isArray(config?.teams) && config.teams.length === 2, 'تتطلب اللعبة فريقين');
  const teams = config.teams.map(t => prepareTeam(t, rules.enabledPowers));
  const ids = teams.flatMap(t => t.categories);
  requireRule(uniqueList(ids, 6, 6), 'يجب اختيار ست فئات مختلفة');
  const chosen = ids.map(id => categories.find(c => c.id === id && published(c)));
  requireRule(chosen.every(Boolean), 'إحدى الفئات غير متاحة');
  const board = makeBoard(chosen, questions, rules, new Set(config.seenQuestionIds || []));
  return { id: randomUUID(), startedAt: now, endedAt: null, phase: 'board', turn: 0,
    teams, categories: structuredClone(chosen), board, current: null, settings: rules,
    attempts: [], events: [{ type:'start', at:now, id:1 }], winner:null, _undo: [] };
}
function record(game, type, now, data = {}) {
  game.events.push({id: game.events.length + 1, at: now, type,
    questionId: game.current?.id ?? null, team: game.current?.actor ?? game.turn, ...data});
}
function updateWinner(game) {
  const diff = game.teams[0].score - game.teams[1].score;
  game.winner = diff === 0 ? null : diff > 0 ? 0 : 1;
}
function currentTile(game) {
  return game.board.find(t => t.id === game.current?.id);
}
function saveUndo(game, action, now) {
  const tile = game.board.find(t => t.id === (game.current?.id ?? action.id));
  const current = structuredClone(game.current);
  if (current?.deadline != null) current.remainingMs = Math.max(0, current.deadline - now);
  game._undo.push({
    firstEvent: game.events.length + 1, phase: game.phase, turn:game.turn, current,
    winner:game.winner, endedAt:game.endedAt, attempts:game.attempts.length,
    teams:game.teams.map(t => ({score:t.score, used:[...t.used]})),
    tileId:tile?.id, status:tile?.status
  });
  if (game._undo.length > 200) game._undo.shift();
}
function undo(game, now) {
  const frame = game._undo.pop();
  requireRule(frame, 'لا يوجد إجراء للتراجع عنه');
  const lastEvent = game.events.length;
  Object.assign(game, {phase:frame.phase, turn:frame.turn, current:frame.current,
    endedAt:frame.endedAt, winner:frame.winner});
  game.attempts.length = frame.attempts;
  frame.teams.forEach((fields, i) => Object.assign(game.teams[i], fields));
  if (frame.tileId) currentTileById(game, frame.tileId).status = frame.status;
  if (game.current?.deadline != null) {
    // A timeout restored by undo waits for the host to restart or judge it.
    if (game.current.remainingMs <= 0) {
      game.current.deadline = null;
      game.current.remainingMs = 1000;
    } else game.current.deadline = now + game.current.remainingMs;
  }
  record(game, 'undo', now, { firstEvent:frame.firstEvent, lastEvent });
}
function currentTileById(game, id) { return game.board.find(t => t.id === id); }
function startTimer(current, seconds, now) {
  current.remainingMs = seconds * 1000;
  current.deadline = now + current.remainingMs;
}
function isAnswering(game) {
  return game.phase === 'answering' || game.phase === 'opponent';
}
function startOpponent(game, now) {
  game.phase = 'opponent';
  game.current.actor = 1 - game.turn;
  startTimer(game.current, game.settings.opponentSeconds, now);
  record(game, 'opponent', now);
}
function adjustScore(game, team, delta) {
  const t = game.teams[team];
  const before = t.score;
  const target = before + delta;
  requireRule(Number.isSafeInteger(target), 'تجاوزت النتيجة الحد المسموح');
  t.score = game.settings.negativeScores ? target : Math.max(0, target);
  return t.score - before;
}
function resolveAttempt(game, outcome, now) {
  const c = game.current, tile = currentTile(game), s = game.settings;
  const attempt = {team:c.actor, outcome, questionId:c.id, at:now};
  game.attempts.push(attempt);
  record(game, 'attempt', now, attempt);
  if (outcome !== 'correct' && game.phase === 'answering' && s.allowSteal && !c.answerShown) {
    startOpponent(game, now);
    return;
  }
  const winner = outcome === 'correct' ? c.actor : null;
  const deltas = [0,0];
  if (winner !== null) {
    if (!c.powers.includes('trap') || s.trapCorrectScores) deltas[winner] = adjustScore(game, winner, tile.points);
    if (c.powers.includes('pit') && (winner === game.turn || s.pitOnSteal))
      deltas[1-winner] = adjustScore(game, 1-winner, -tile.points);
  } else if (c.powers.includes('trap') && (outcome !== 'timeout' || s.trapTimeoutPenalty)) {
    deltas[c.actor] = adjustScore(game, c.actor, -tile.points);
  }
  tile.status = 'done';
  game.phase = 'resolved';
  Object.assign(c, { result:{winner, deltas, outcome}, answerShown:true, deadline:null, remainingMs:0, restrictedPlayer:null, restrictions:[] });
  record(game, 'score', now, c.result);
}
function usePower(game, action, now) {
  const c = game.current;
  requireRule(c && (game.phase === 'selected' || isAnswering(game)), 'اختر سؤالاً أولاً');
  const t = game.teams[c.actor], power = action.power;
  requireRule(t.powers.includes(power) && !t.used.includes(power), 'وسيلة المساعدة غير متاحة');
  requireRule(!c.answerShown && (power === 'pit' ? game.phase === 'selected' : isAnswering(game)), 'لا يمكن استخدام هذه الوسيلة في هذه المرحلة');
  if (power === 'trap') requireRule(game.phase === 'answering', 'لا يمكن نقل السؤال مرة ثانية');
  if (power === 'break') {
    requireRule(game.teams[1-c.actor].players.includes(action.player), 'اختر لاعباً من الفريق المنافس');
    c.restrictions ??= [];
    c.restrictions.push({team:1-c.actor, player:action.player});
    c.restrictedPlayer = c.restrictions.map(r => r.player).join('، ');
  }
  t.used.push(power);
  c.powers.push(power);
  record(game, 'power', now, { power, player:power === 'break' ? action.player : null });
  if (power === 'call' && game.settings.callSeconds) {
    const bonus = game.settings.callSeconds * 1000;
    if (c.deadline != null) c.deadline += bonus;
    c.remainingMs += bonus;
  }
  if (power === 'trap') startOpponent(game, now);
}
function finishQuestion(game, now) {
  const winner = game.current.result.winner;
  if (game.board.every(t => t.status === 'done')) {
    game.phase = 'complete';
    game.endedAt = now;
    updateWinner(game);
  } else {
    if (game.settings.nextTurn === 'winner' && winner !== null) game.turn = winner;
    else if (game.settings.nextTurn !== 'retain') game.turn = 1-game.turn;
    game.phase = 'board';
  }
  record(game, game.phase === 'complete' ? 'complete' : 'board', now, {nextTeam:game.turn});
  game.current = null;
}
function act(previous, action, now = Date.now()) {
  requireRule(action && typeof action.type === 'string', 'إجراء غير صالح');
  const expired = isAnswering(previous) && previous.current.deadline != null && now >= previous.current.deadline;
  if (action.type === 'sync' && !expired) return previous;
  const game = structuredClone(previous);
  if (action.type === 'undo') { undo(game, now); return game; }
  if (expired) {
    // An overdue host click can only settle the expired attempt, never score the next one.
    saveUndo(game, {type:'timeout'}, now);
    resolveAttempt(game, 'timeout', now);
    return game;
  }
  const c = game.current;
  saveUndo(game, action, now);
  switch (action.type) {
    case 'select': {
      const tile = currentTileById(game, action.id);
      requireRule(game.phase === 'board' && tile?.status === 'open', 'هذا السؤال غير متاح');
      game.phase = 'selected';
      tile.status = 'selected';
      game.current = {id:tile.id, actor:game.turn, answerShown:false, deadline:null,
        remainingMs:0, powers:[], restrictedPlayer:null, restrictions:[], result:null};
      record(game, 'select', now);
      break;
    }
    case 'reveal':
      requireRule(game.phase === 'selected', 'تم كشف السؤال أو لم يتم اختياره');
      game.phase = 'answering';
      startTimer(c, game.settings.activeSeconds, now);
      record(game, 'reveal', now);
      break;
    case 'timer':
      requireRule(isAnswering(game) && !c.answerShown, 'المؤقت غير متاح');
      if (c.deadline != null) {
        c.remainingMs = c.deadline - now;
        c.deadline = null;
      } else c.deadline = now + c.remainingMs;
      record(game, c.deadline == null ? 'pause' : 'resume', now);
      break;
    case 'answer':
      requireRule(isAnswering(game) && !c.answerShown, 'الإجابة غير متاحة');
      c.answerShown = true;
      if (c.deadline != null) c.remainingMs = c.deadline - now;
      c.deadline = null;
      record(game, 'answer', now);
      break;
    case 'power': usePower(game, action, now); break;
    case 'correct': case 'incorrect': case 'pass':
      requireRule(isAnswering(game), 'لا توجد محاولة مفتوحة لهذا السؤال');
      resolveAttempt(game, action.type, now);
      break;
    case 'timeout':
      requireRule(false, 'لم تنتهِ المهلة بعد');
      break;
    case 'next':
      requireRule(game.phase === 'resolved', 'يجب حسم السؤال أولاً');
      finishQuestion(game, now);
      break;
    case 'adjust': {
      requireRule(integer(action.team, 0, 1) && integer(action.delta, -1000000, 1000000) &&
        action.delta !== 0 && typeof action.reason === 'string' && action.reason.trim().length > 0 &&
        action.reason.length <= 300, 'أدخل تعديلاً صحيحاً مع توضيح السبب');
      const delta = adjustScore(game, action.team, action.delta);
      if (game.phase === 'complete') updateWinner(game);
      record(game, 'adjust', now, {team:action.team, delta, reason:action.reason.trim()});
      break;
    }
    default: requireRule(false, 'إجراء غير معروف');
  }
  return game;
}

function publicGame(game, now = Date.now()) {
  const { _undo, board, ...other } = game;
  const view = structuredClone(other);
  view.canUndo = _undo.length > 0;
  if (view.current?.deadline != null) view.current.remainingMs = Math.max(0, view.current.deadline - now);
  view.board = board.map(({question, ...tile}) => {
    if (tile.id !== view.current?.id || view.phase === 'selected') return {...tile};
    const fields = ['id','categoryId','text','type','media','mediaUrl','mediaType','choices','options','difficulty','points'];
    if (view.current.answerShown) fields.push('answer','explanation','alternatives','acceptableAnswers','yearTolerance','tolerance','variants');
    const safeQuestion = {};
    for (const key of fields) if (Object.hasOwn(question, key)) safeQuestion[key] = structuredClone(question[key]);
    return {...tile, question:safeQuestion};
  });
  return view;
}
module.exports = { DEFAULTS, validateSettings, distributePlayers, createGame, act, publicGame };
