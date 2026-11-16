const express=require('express');const Database=require('better-sqlite3');const app=express();const db=new Database(process.env.DB_FILE||'app.db');db.pragma('foreign_keys=ON');
db.exec(`CREATE TABLE IF NOT EXISTS companies(id INTEGER PRIMARY KEY,name TEXT NOT NULL UNIQUE,industry TEXT);
CREATE TABLE IF NOT EXISTS contacts(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT,company_id INTEGER REFERENCES companies(id),created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS deals(id INTEGER PRIMARY KEY,title TEXT NOT NULL,value REAL NOT NULL DEFAULT 0,stage TEXT NOT NULL DEFAULT 'new',contact_id INTEGER REFERENCES contacts(id));
CREATE TABLE IF NOT EXISTS activities(id INTEGER PRIMARY KEY,contact_id INTEGER NOT NULL REFERENCES contacts(id),note TEXT NOT NULL,due_date TEXT NOT NULL,done INTEGER NOT NULL DEFAULT 0);`);
app.disable('x-powered-by');app.use((req,res,next)=>{res.set('X-Content-Type-Options','nosniff');res.set('Referrer-Policy','no-referrer');res.set('X-Frame-Options','DENY');next()});app.use(express.json({limit:'32kb'}));app.use(express.static('public'));

const crypto = require('node:crypto');
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  const required = process.env.API_TOKEN;
  if (!required && process.env.APP_ENV !== 'production') return next();
  if (!required) return res.status(503).json({error:'API authentication must be configured in production'});
  const actual = req.get('x-api-token') || '';
  const expectedBytes = Buffer.from(required, 'utf8');
  const actualBytes = Buffer.from(actual, 'utf8');
  if (expectedBytes.length !== actualBytes.length || !crypto.timingSafeEqual(expectedBytes, actualBytes)) {
    return res.status(401).json({error:'Unauthorized'});
  }
  next();
});

const wrap=f=>(req,res)=>{try{res.json(f(req,res))}catch(e){res.status(400).json({error:e.message})}};
app.get('/api/companies',wrap(()=>db.prepare('SELECT * FROM companies ORDER BY id DESC').all()));
app.post('/api/companies',wrap(req=>{if(!req.body.name?.trim())throw Error('Company name required');return db.prepare('INSERT INTO companies(name,industry) VALUES(?,?)').run(req.body.name.trim(),req.body.industry||null)}));
app.get('/api/contacts',wrap(()=>db.prepare('SELECT contacts.*, companies.name company FROM contacts LEFT JOIN companies ON companies.id=contacts.company_id ORDER BY contacts.id DESC').all()));
app.post('/api/contacts',wrap(req=>{const {name,email,company_id}=req.body;if(!name?.trim())throw Error('Contact name required');return db.prepare('INSERT INTO contacts(name,email,company_id) VALUES(?,?,?)').run(name.trim(),email||null,company_id||null)}));
app.get('/api/deals',wrap(()=>db.prepare('SELECT deals.*,contacts.name contact FROM deals LEFT JOIN contacts ON deals.contact_id=contacts.id ORDER BY deals.id DESC').all()));
app.post('/api/deals',wrap(req=>{const {title,value=0,stage='new',contact_id}=req.body;if(!title?.trim()||!['new','qualified','proposal','won','lost'].includes(stage)||!Number.isFinite(Number(value))||Number(value)<0)throw Error('Invalid deal');return db.prepare('INSERT INTO deals(title,value,stage,contact_id) VALUES(?,?,?,?)').run(title.trim(),Number(value),stage,contact_id||null)}));
app.patch('/api/deals/:id',wrap(req=>{if(!['new','qualified','proposal','won','lost'].includes(req.body.stage))throw Error('Invalid stage');const r=db.prepare('UPDATE deals SET stage=? WHERE id=?').run(req.body.stage,req.params.id);if(!r.changes)throw Error('Deal not found');return {updated:true}}));
app.get('/api/activities',wrap(()=>db.prepare('SELECT activities.*,contacts.name contact FROM activities JOIN contacts ON contacts.id=activities.contact_id ORDER BY done,due_date').all()));
app.post('/api/activities',wrap(req=>{const {contact_id,note,due_date}=req.body;if(!contact_id||!note?.trim()||!/\d{4}-\d{2}-\d{2}/.test(due_date||''))throw Error('Contact, note and due date required');return db.prepare('INSERT INTO activities(contact_id,note,due_date) VALUES(?,?,?)').run(contact_id,note.trim(),due_date)}));
app.patch('/api/activities/:id/done',wrap(req=>{const r=db.prepare('UPDATE activities SET done=1 WHERE id=?').run(req.params.id);if(!r.changes)throw Error('Activity not found');return {updated:true}}));

// Lightweight service introspection: intentionally no secrets or database contents.
app.get('/api/health',(_req,res)=>{try{db.prepare('SELECT 1').get();res.json({status:'ok',service:process.env.npm_package_name||'portfolio-service'})}catch(_e){res.status(503).json({status:'unavailable'})}});
app.get('/api/insights',(_req,res)=>{try{res.json((()=>{ const companies=db.prepare('SELECT COUNT(*) n FROM companies').get().n;const contacts=db.prepare('SELECT COUNT(*) n FROM contacts').get().n;const stages=db.prepare('SELECT stage,COUNT(*) count,ROUND(SUM(value),2) value FROM deals GROUP BY stage ORDER BY stage').all();const overdue=db.prepare("SELECT COUNT(*) n FROM activities WHERE done=0 AND due_date < date('now')").get().n;return {companies,contacts,deals_by_stage:stages,overdue_followups:overdue}; })())}catch(_e){res.status(500).json({error:'Unable to load insights'})}});
app.use((err,req,res,next)=>{if(err&&err.type==='entity.too.large')return res.status(413).json({error:'Request body too large'});if(err instanceof SyntaxError && 'body' in err)return res.status(400).json({error:'Malformed JSON'});return res.status(500).json({error:'Unexpected server error'})});
app.listen(Number(process.env.PORT)||3000,()=>console.log('NexaCRM running'));
