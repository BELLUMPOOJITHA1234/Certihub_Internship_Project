const admin = require('firebase-admin');
const os = require('os');

exports.getAdminStats = async (req, res) => {
  const startTime = Date.now();
  const { range } = req.query; // 7D, 1M, 3M, 1Y, ALL
  
  // Security Check: Only admin can access
  if (req.user.email !== 'admin@certihub.com' && req.user.email !== 'demo@gmail.com') {
    return res.status(403).json({ error: "Access denied: Admin eyes only." });
  }

  if (admin.apps.length === 0) {
    return res.status(500).json({ error: "Firebase Admin not initialized. Admin stats unavailable." });
  }

  try {
    const db = admin.firestore();
    
    // 1. Fetch Total Certificates
    const certsSnapshot = await db.collection('certificates').limit(1000).get();
    const certs = certsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createTime: doc.createTime.toDate() }));
    
    // 2. Fetch Total Users
    const usersSnapshot = await db.collection('users').limit(1000).get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // 2.5 Filter certificates based on range
    const now = new Date();
    let filteredCerts = certs;
    
    if (range && range !== 'ALL') {
      const rangeMs = {
        '7D': 7 * 24 * 60 * 60 * 1000,
        '1M': 30 * 24 * 60 * 60 * 1000,
        '3M': 90 * 24 * 60 * 60 * 1000,
        '1Y': 365 * 24 * 60 * 60 * 1000
      }[range];
      
      if (rangeMs) {
        const cutoff = new Date(now.getTime() - rangeMs);
        filteredCerts = certs.filter(c => new Date(c.createTime) >= cutoff);
      }
    }

    // 3. Process Real Analytics
    const now_val = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let growthData = [];
    
    if (range === '7D') {
      // Daily granularity for 7D
      const dailyMap = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(now_val.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toLocaleDateString('en-US', { weekday: 'short' });
        dailyMap[key] = 0;
      }
      
      filteredCerts.forEach(c => {
        const key = new Date(c.createTime).toLocaleDateString('en-US', { weekday: 'short' });
        if (dailyMap[key] !== undefined) dailyMap[key]++;
      });
      
      growthData = Object.entries(dailyMap).reverse().map(([label, count]) => ({ month: label, count }));
    } else {
      // Monthly granularity for others
      const growthMap = {};
      filteredCerts.forEach(c => {
        const date = new Date(c.createTime);
        const monthYear = `${months[date.getMonth()]}`;
        growthMap[monthYear] = (growthMap[monthYear] || 0) + 1;
      });

      growthData = months.map(m => ({
        month: m,
        count: growthMap[m] || 0
      })).filter((d, i) => i <= now_val.getMonth());
    }

    const stats = {
      totalCertificates: filteredCerts.length,
      totalUsers: users.length,
      verifiedUsers: users.filter(u => u.isVerified).length,
      recentActivity: filteredCerts.slice(0, 10).map(c => ({
        id: c.id,
        title: c.title || "Unknown",
        issuer: c.issuer || "Unknown",
        createdAt: c.createTime
      })),
      issuerDistribution: filteredCerts.reduce((acc, c) => {
        const issuer = c.issuer || "Other";
        acc[issuer] = (acc[issuer] || 0) + 1;
        return acc;
      }, {}),
      growthData: growthData,
      health: {
        latency: `${Date.now() - startTime}ms`,
        uptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
        memory: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        cpuLoad: `${Math.round((process.cpuUsage().user + process.cpuUsage().system) / 1000000)}%`,
        status: "Healthy"
      }
    };

    res.json(stats);
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
};
