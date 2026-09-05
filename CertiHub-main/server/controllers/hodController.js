const admin = require('firebase-admin');

exports.createMentor = async (req, res) => {
  const { email, name } = req.body;
  const { institutionId, department, uid: hodId } = req.user;
  const domain = email.split('@')[1];
  const defaultPassword = `${domain}@123`;

  // Verify domain match (mentors must belong to the same institution domain)
  const hodEmailDomain = req.user.email.split('@')[1];
  if (domain !== hodEmailDomain) {
    return res.status(400).json({ error: "Mentors must belong to the same institutional domain." });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password: defaultPassword,
      displayName: name,
    });

    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      name,
      department,
      institutionId,
      hodId,
      role: 'mentor',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ 
      message: `Mentor account created for ${name}`, 
      uid: userRecord.uid 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.linkStudent = async (req, res) => {
  const { studentEmail, mentorId } = req.body;
  
  try {
    // Find student by email
    const studentSnapshot = await admin.firestore().collection('users')
      .where('email', '==', studentEmail)
      .where('role', '==', 'student')
      .limit(1)
      .get();

    if (studentSnapshot.empty) {
      return res.status(404).json({ error: "Student not found." });
    }

    const studentId = studentSnapshot.docs[0].id;

    // Link mentor to student
    await admin.firestore().collection('users').doc(studentId).update({
      mentorId,
      institutionId: req.user.institutionId,
      department: req.user.department
    });

    // Update mentor's student roster
    await admin.firestore().collection('users').doc(mentorId).update({
      assignedStudents: admin.firestore.FieldValue.arrayUnion(studentId)
    });

    res.json({ message: "Student successfully linked to mentor." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
