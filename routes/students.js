let {Student} = require('../model/schemas');

function getAll(req, res) {
    Student.find().then((students) => {
        res.json(students);
    }).catch((err) => {
        res.json({error: err});
    });
}


function create(req, res) {
    let student = new Student();
    student.firstName = req.body.firstName;
    student.lastName = req.body.lastName;

    student.save()
        .then((student) => {
                res.json({message: `student saved with id ${student.id}!`});
            }
        ).catch((err) => {
        res.send('cant post student ', err);
    });
}

module.exports = {getAll, create};
