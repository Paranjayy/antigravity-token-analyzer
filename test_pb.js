const fs = require('fs');
const buf = fs.readFileSync('/Users/paranjay/.gemini/antigravity/conversations/1615f661-dc80-4b28-b459-c787a06d5beb.pb');
const str = buf.toString('utf8');
const words = str.match(/[A-Za-z0-9_]{5,}/g);
console.log("Words found:", words ? words.length : 0);
console.log(words ? words.slice(0, 20) : "none");
