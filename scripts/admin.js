const {db}=require('../db');
const username=process.argv[2];
if(!username)throw Error('Usage: npm run admin -- registered_username');
const r=db.prepare("UPDATE User SET role='admin',disabled=0 WHERE username=? AND password IS NOT NULL").run(username);
if(!r.changes)throw Error('Register this account first.');
db.prepare('INSERT INTO AdminAudit(userId,operation,entity,created) VALUES (?,?,?,?)').run('local-console','promote',username,Date.now());
console.log('Administrator role granted.');
