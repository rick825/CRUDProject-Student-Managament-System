const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;


// mongo
mongoose.connect('mongodb+srv://sky_admin:skydb@cluster-9.xxo8ioi.mongodb.net/Student-Management', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(()=>console.log(`Database is connected Successfully!`))
.catch((error)=> console.log("Error->",error));


// schema
const studentSchema = new mongoose.Schema({
  studentID: { type: Number, unique: true },
  name: String,
  age: Number,
});

const academicSchema = new mongoose.Schema({
    studentID: { type: Number, unique: true },
    grades: Number,
    subjects: [String],
  });


const coCurricularSchema = new mongoose.Schema({
    studentID: { type: Number, unique: true },
    activityType: String,
    duration: String,
    achievement: String,
  });

//  models
const StudentRecords = mongoose.model('studentRecord', studentSchema);
const AcademicRecord = mongoose.model('AcademicRecord', academicSchema);
const CoCurricularActivity = mongoose.model('CoCurricularActivity', coCurricularSchema);
  

// middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


// Routes
app.get('/', (req, res) => {
    res.render("index.html")
  });


app.get('/academics',(req,res)=>{
  res.redirect("seeAcademics.html");
})  

app.get('/cocurricular',(req,res)=>{
  res.redirect("seeCocurricular.html");
})

// Handle fetch
app.get('/getStudents', async (req, res) => {
    try {
      const students = await StudentRecords.find().sort({ studentID: 1 });
      res.json(students);
    } catch (error) {
      console.error('Error fetching student records:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/getAcademics',async (req,res)=>{
    try{
      const students = await StudentRecords.find().sort({ studentID: 1 });
       const  academics = await  AcademicRecord.find().sort({ studentID: 1 });
       res.json({students,academics});
    }catch(error){
      console.error('Error fetching student records:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  })

  app.get('/getCocurricular', async (req,res)=>{
    try{
      const students = await StudentRecords.find().sort({studentID: 1});
      const  cocurri = await CoCurricularActivity.find().sort({studentID:1});

      res.json({students,cocurri});
    }
    catch{
      console.error('Error fetching student records:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  })



//Handle Submissions / Post Requests
app.post('/addStudents',(req,res)=>{
    const studentRecords = new StudentRecords({
        studentID: req.body.studentID,
        name: req.body.name,
        age: req.body.age,
    });

    studentRecords.save()
    .then((record)=>{
        console.log("Student Records are updates. Records-->",record);
        res.redirect('/');
    })
    .catch((err) => {
        console.log("Error in saving the student records", err);
        res.status(500).send("Error: " + err.message);
    });
})

app.post('/addAcademics', async (req, res) => {
    const Id = req.body.studentID;

    try {
        const existingStudent = await StudentRecords.findOne({ studentID: Id });

        if (existingStudent) {
            const existingAcademics = await AcademicRecord.findOne({ studentID: existingStudent.studentID });
           
            // update academics
            if (existingAcademics) {
                existingAcademics.grades = req.body.grades;
                existingAcademics.subjects = req.body.subjects.split(',').map(subject => subject.trim());

                await existingAcademics.save();
                console.log("Academics Updated Successfully");
                return res.redirect('/academics');
            }

            const academics = new AcademicRecord({
                studentID: existingStudent.studentID,
                grades: req.body.grades,
                subjects: req.body.subjects.split(',').map(subject => subject.trim()),
            });

            await academics.save();
            console.log("Academics Added Successfully");
            return res.redirect('/academics');
        } else {
            console.log("No Student Found");
            res.status(404).send("No Student Record Found, Kindly add a new record first.");
        }
    } catch (err) {
        console.log("Error while adding academic record: ", err);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/addCocurricular',async (req,res)=>{
  try{
        
       const studentId = req.body.studentID;
       const student = await  StudentRecords.findOne({studentID:studentId});

       if(student){
        const hasCocurri = await CoCurricularActivity.findOne({studentID : studentId});
        //update cocurricular
         if(hasCocurri){
          hasCocurri.activityType =  req.body.activityType;
          hasCocurri.duration = req.body.duration;
          hasCocurri.achievement = req.body.achievement;

          await hasCocurri.save();
          console.log("Cocurricular Updated Succesfully");
          return res.redirect('/cocurricular');
         }

         const cocurricular = new CoCurricularActivity({
             studentID : studentId,
              activityType : req.body.activityType,
              duration : req.body.duration,
              achievement : req.body.achievement,
         });

         await cocurricular.save();
         console.log("Cocurricular Added Succesfully!!");
         return res.redirect('/cocurricular');
       }else{
        console.log("No Student Found Kindly add new Student First");
        res.status(404).send("No Student Found Kindly add new Student First")
       }

  }catch(error){
    console.log("Error while adding Cocurricular->",error);
    res.status(500).send("Internal Server Error");
  }



})


//Handle Delete
app.get('/deleteStudent/:id', async (req, res) => {
  const studentId = req.params.id;
  

  console.log("ID is->>",studentId);
  try {
      await StudentRecords.findOneAndDelete({ studentID: studentId});
      await  AcademicRecord.findOneAndDelete({ studentID: studentId});
      await CoCurricularActivity.findOneAndDelete({ studentID: studentId});

      console.log(`Student ${studentId} deleted successfully`);
      res.redirect('/'); 
  } catch (err) {
      console.log("Error while deleting record: ", err);
      res.status(500).send("Internal Server Error");
  }
});



app.listen(port,()=>{
    console.log(`Server is running on port http://localhost:${port}`);
})