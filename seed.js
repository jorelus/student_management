const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connexion à MongoDB Atlas
const uri = 'mongodb+srv://orelus_db_user:Admin123@cluster0.szo0cmo.mongodb.net/?appName=Cluster0';

// Schémas
const StudentSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
});

const CourseSchema = new mongoose.Schema({
    name: String,
    code: String,
});

const GradeSchema = new mongoose.Schema({
    student: {type: mongoose.Schema.Types.ObjectId, ref: 'Student'},
    course: {type: mongoose.Schema.Types.ObjectId, ref: 'Course'},
    grade: Number,
    date: Date,
});

const Student = mongoose.model('Student', StudentSchema);
const Course = mongoose.model('Course', CourseSchema);
const Grade = mongoose.model('Grade', GradeSchema);

const seedData = async () => {
    try {
        // Connexion
        await mongoose.connect(uri);
        console.log('✅ MongoDB connecté');

        // Charger data.json
        const dataPath = path.join(__dirname, '../..', 'session-001-jorelus', 'data.json');
        const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        console.log(`📄 ${rawData.length} enregistrements lus de data.json`);

        // Vider les collections
        await Student.deleteMany({});
        await Course.deleteMany({});
        await Grade.deleteMany({});
        console.log('🗑️ Collections vidées');

        // Extraire les étudiants uniques
        const studentsMap = new Map();
        const coursesMap = new Map();

        rawData.forEach((item) => {
            // Étudiant
            if (item.student && item.student.id) {
                if (!studentsMap.has(item.student.id)) {
                    studentsMap.set(item.student.id, {
                        firstName: item.student.firstname,
                        lastName: item.student.lastname,
                    });
                }
            }
            // Cours
            if (item.course && !coursesMap.has(item.course)) {
                coursesMap.set(item.course, {
                    name: item.course,
                    code: item.course.split(' ')[0],
                });
            }
        });

        // Insérer les étudiants
        const studentsData = Array.from(studentsMap.values());
        const insertedStudents = await Student.insertMany(studentsData);
        console.log(`✅ ${insertedStudents.length} étudiants insérés`);

        // Insérer les cours
        const coursesData = Array.from(coursesMap.values());
        const insertedCourses = await Course.insertMany(coursesData);
        console.log(`✅ ${insertedCourses.length} cours insérés`);

        // Créer un mapping pour les references
        const studentMap = new Map();
        insertedStudents.forEach((student) => {
            const key = `${student.firstName}-${student.lastName}`;
            studentMap.set(key, student._id);
        });

        const courseMap = new Map();
        insertedCourses.forEach((course) => {
            courseMap.set(course.name, course._id);
        });

        // Insérer les grades
        const gradesData = rawData.map((item) => {
            const studentKey = `${item.student.firstname}-${item.student.lastname}`;
            return {
                student: studentMap.get(studentKey),
                course: courseMap.get(item.course),
                grade: item.grade,
                date: new Date(item.date),
            };
        });

        const insertedGrades = await Grade.insertMany(gradesData);
        console.log(`✅ ${insertedGrades.length} grades insérés`);

        console.log('🎉 Données importées avec succès!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
};

seedData();
