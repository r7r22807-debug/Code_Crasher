const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs');
const path=require('node:path');
const location=process.env.TRIVIA_DATA || path.join(__dirname,'data');
fs.mkdirSync(location,{recursive:true});
const db=new DatabaseSync(path.join(location,'arena.sqlite'));
db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000');
function transaction(fn){
 db.exec('BEGIN IMMEDIATE');
 try {const result=fn(); db.exec('COMMIT'); return result}
 catch(error){db.exec('ROLLBACK'); throw error}
}
transaction(()=>{
 if(db.prepare('PRAGMA user_version').get().user_version>=1)return;
 db.exec(`
 CREATE TABLE User(id TEXT PRIMARY KEY,username TEXT UNIQUE COLLATE NOCASE,password TEXT,role TEXT DEFAULT 'player',disabled INTEGER DEFAULT 0, favorites TEXT DEFAULT '[]', teamNames TEXT DEFAULT '[]');
 CREATE TABLE AuthSession(token TEXT PRIMARY KEY,userId TEXT NOT NULL REFERENCES User(id),expires INTEGER NOT NULL);
 CREATE TABLE Category(id TEXT PRIMARY KEY,doc TEXT NOT NULL);
 CREATE TABLE Question(id TEXT PRIMARY KEY,categoryId TEXT NOT NULL REFERENCES Category(id),doc TEXT NOT NULL);
 CREATE INDEX question_category ON Question(categoryId);
 CREATE TABLE QuestionMedia(id TEXT PRIMARY KEY,mime TEXT NOT NULL,bytes BLOB NOT NULL);
 CREATE TABLE GameSession(id TEXT PRIMARY KEY,userId TEXT NOT NULL REFERENCES User(id),version INTEGER NOT NULL,state TEXT NOT NULL,phase TEXT NOT NULL,updated INTEGER NOT NULL);
 CREATE INDEX games_owner ON GameSession(userId,updated);
 CREATE TABLE Team(gameId TEXT REFERENCES GameSession(id),team INTEGER,name TEXT,PRIMARY KEY(gameId,team));
 CREATE TABLE Player(gameId TEXT,team INTEGER,name TEXT,FOREIGN KEY(gameId,team) REFERENCES Team(gameId,team));
 CREATE TABLE PowerUp(id TEXT PRIMARY KEY);
 INSERT INTO PowerUp VALUES ('call'),('two'),('pit'),('break'),('trap');
 CREATE TABLE TeamPowerUp(gameId TEXT,team INTEGER,power TEXT REFERENCES PowerUp(id), PRIMARY KEY(gameId,team,power),FOREIGN KEY(gameId,team) REFERENCES Team(gameId,team));
 CREATE TABLE GameSessionQuestion(gameId TEXT REFERENCES GameSession(id),questionId TEXT,snapshot TEXT NOT NULL,PRIMARY KEY(gameId,questionId));
 CREATE TABLE QuestionAttempt(gameId TEXT REFERENCES GameSession(id),ordinal INTEGER,doc TEXT,PRIMARY KEY(gameId,ordinal));
 CREATE TABLE GameEvent(gameId TEXT REFERENCES GameSession(id),version INTEGER,command TEXT,details TEXT,created INTEGER,PRIMARY KEY(gameId,version));
 CREATE TABLE QuestionReport(id INTEGER PRIMARY KEY,gameId TEXT REFERENCES GameSession(id),questionId TEXT,message TEXT,resolved INTEGER DEFAULT 0,created INTEGER);
 CREATE TABLE Feedback(id INTEGER PRIMARY KEY,userId TEXT,message TEXT,created INTEGER);
 CREATE TABLE AdminAudit(id INTEGER PRIMARY KEY,userId TEXT,operation TEXT,entity TEXT,created INTEGER);
 CREATE TABLE GameSettings(id INTEGER PRIMARY KEY CHECK(id=1),doc TEXT);
 INSERT INTO GameSettings VALUES(1,'{}');
 PRAGMA user_version=1;`);
 const {categories,questions}=require('./seed');
 const cat=db.prepare('INSERT INTO Category VALUES(?,?)'),q=db.prepare('INSERT INTO Question VALUES(?,?,?)');
 for(const c of categories)cat.run(c.id,JSON.stringify(c));
 for(const item of questions)q.run(item.id,item.categoryId,JSON.stringify(item));
});
module.exports={db,transaction};
