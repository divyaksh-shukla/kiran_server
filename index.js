var express = require('express');
var cors = require('cors');
var sqlite = require('sqlite3');
const Status = require('./utils/consts');
const port = 5000

var db = new sqlite.Database('varsha.db')

var app = express();
app.use(express.json());

app.get('/api/', (req, res) => {
    res.send('hello');
});

app.get('/api/achievement/categories/', (req, res) => {
    db.all(`SELECT * from SkillCategory as s`, (err, rows) => {
        if (err) {
            console.log(err);
            res.status(500);
            res.send(`Some error`);
        }
        rows.sort((a, b) => a.orderIndex - b.orderIndex);
        res.json(rows);
    });
});

app.get('/api/achievement/:id', (req, res) => {
    db.all(`SELECT skill.title, skill.color, skill.key, skill.orderIndex, category.name as category
    from Students as student, Skills as skill, Students_skills_levels as ss, SkillCategory as category 
    WHERE student.key=ss.studentKey AND skill.key=ss.skillKey AND category.key=skill.categoryKey
    AND student.key=?`,
        req.params.id, (err, rows) => {
            rows.sort((a, b) => a.orderIndex - b.orderIndex);
            res.json(rows);
        });
});

app.get('/api/achievement/:category/:id', (req, res) => {

    var allData = [];
    var completedData = null;
    db.serialize(() => {
        db.all(`SELECT skill.title, skill.color, skill.key, skill.orderIndex, category.name as category, level.name as levelName, level.value as levelValue, count(assignment.key) as totalAssignments
                from Students as student, Skills as skill, Students_skills_levels as ss, SkillCategory as category, Levels as level, Assignments as assignment
                WHERE student.key=ss.studentKey AND skill.key=ss.skillKey AND category.key=skill.categoryKey AND ss.levelKey=level.key AND assignment.skillKey=skill.key AND assignment.levelKey=level.key
                AND student.key=? AND category.name=?`,
        req.params.id, req.params.category, (err, rows) => {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }
            rows.sort((a, b) => a.orderIndex - b.orderIndex);
            allData = rows.map((row) => {
                row['level'] = `Level ${row.levelValue}: ${row.levelName}`;
                delete row['levelName'];
                delete row['levelValue'];
                return row;
            });
        });

        // Completed Assignments
        db.all(`SELECT skill.key, count(*) as completed
        from Students as student, Students_assignments as sa, Skills as skill, Levels as level, Assignments as assignment, Students_skills_levels as ss
        WHERE student.key=sa.studentKey AND assignment.key=sa.assignmentKey AND assignment.skillKey=skill.key AND assignment.levelKey=level.key AND ss.skillKey=skill.key AND ss.studentKey=student.key AND ss.levelKey=level.key
        AND status=? AND student.key=?`,
        Status.Completed, req.params.id, (err, rows) => {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }
            try {
                completedData = [...rows];
                completedData.forEach((row) => {
                    var index = allData.findIndex((data) => data.key === row.key)
                    allData[index].completedAssignments = row.completed
                });
    
                allData = allData.map((row) => {
                    if (row.completedAssignments === row.totalAssignments) {
                        return {...row, assignmentColor: 'green'}
                    }
                    else {
                        return {...row, assignmentColor: 'blue'}
                    }
                });
    
                res.json(allData);
            }
            catch {
                res.status(500);
                res.send(err);
                return;
            }
        });

    });
});

app.listen(5000, () => {
    console.log(`Listening on URL http://localhost:${port}`)
});
