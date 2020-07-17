var express = require('express');
var cors = require('cors');
var sqlite = require('sqlite3');
const port = 5000

var db = new sqlite.Database('varsha.db')

var app = express();
app.use(express.json())

app.get('/api/achievement/:id', (req, res) => {
    db.all('SELECT skill.title, skill.color, skill.key, skill.orderIndex from Students as student, Skills as skill, Students_skills as ss WHERE student.key=ss.studentKey AND skill.key=ss.skillKey AND student.key=?',
    req.params.id, (err, rows) => {
        rows.sort((a, b) => a.orderIndex - b.orderIndex);
        res.json(rows);
    });
});

app.listen(5000, () => {
    console.log(`Listening on URL http://localhost:${port}`)
});
