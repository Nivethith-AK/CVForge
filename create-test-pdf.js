import fs from 'fs';

// Create a minimal valid PDF with sample resume content
const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 800 >>
stream
BT
/F1 24 Tf
50 750 Td
(Arash Khoshraftar) Tj
0 -30 Td
/F1 10 Tf
(Email: arash@example.com | Phone: 555-1234 | LinkedIn: linkedin.com/in/arash) Tj
0 -40 Td
/F1 14 Tf
(PROFESSIONAL SUMMARY) Tj
0 -20 Td
/F1 10 Tf
(Experienced software engineer with 5+ years building scalable web applications) Tj
0 -15 Td
(using React, TypeScript, and Node.js. Expertise in full-stack development.) Tj
0 -40 Td
/F1 14 Tf
(CORE SKILLS) Tj
0 -20 Td
/F1 10 Tf
(React, TypeScript, Node.js, AWS, Docker, PostgreSQL, MongoDB) Tj
0 -15 Td
(REST APIs, GraphQL, Git, CI/CD, Agile methodologies) Tj
0 -40 Td
/F1 14 Tf
(PROFESSIONAL EXPERIENCE) Tj
0 -20 Td
/F1 11 Tf
(Senior Frontend Engineer - TechCorp Inc. | Jan 2021 - Present) Tj
0 -15 Td
/F1 10 Tf
(Led frontend architecture for React dashboard serving 10k+ users) Tj
0 -15 Td
(Improved performance by 40% through optimization) Tj
0 -30 Td
/F1 11 Tf
(Software Engineer - StartupXYZ | Jun 2018 - Dec 2020) Tj
0 -15 Td
/F1 10 Tf
(Built API integrations with third-party services) Tj
0 -15 Td
(Reduced API response time from 500ms to 150ms) Tj
0 -40 Td
/F1 14 Tf
(EDUCATION) Tj
0 -20 Td
/F1 11 Tf
(Bachelor of Science in Computer Science) Tj
0 -15 Td
/F1 10 Tf
(State University | Graduated: May 2018) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000001093 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1170
%%EOF`;

fs.writeFileSync('test_resume.pdf', pdf, 'utf8');
console.log('Test PDF created: test_resume.pdf');
