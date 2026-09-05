const admin = require('firebase-admin');

exports.getMyStudents = async (req, res) => {
  try {
    const mentorDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    const studentIds = mentorDoc.data().assignedStudents || [];

    if (studentIds.length === 0) return res.json([]);

    const studentsSnapshot = await admin.firestore().collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', studentIds)
      .get();

    const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyCertificate = async (req, res) => {
  const { certificateId, status, comments } = req.body; // status: 'verified' or 'rejected'

  try {
    await admin.firestore().collection('certificates').doc(certificateId).update({
      verificationStatus: status,
      verifiedBy: req.user.email,
      verificationDate: admin.firestore.FieldValue.serverTimestamp(),
      mentorComments: comments || ""
    });

    res.json({ message: `Certificate ${status} successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
