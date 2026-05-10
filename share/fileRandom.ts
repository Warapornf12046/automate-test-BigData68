import * as fs from "fs";
import * as path from "path";
export function createRandomUploadFile(ext: "pdf" | "xlsx" | "txt" = "pdf") {
  const dir = path.join(process.cwd(), "tests", "filetest");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  const fileName = `upload-${unique}.${ext}`;
  const filePath = path.join(dir, fileName);

  if (ext === "pdf") {
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
50 250 Td
(Random ${unique}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000059 00000 n 
0000000118 00000 n 
0000000219 00000 n 
trailer
<< /Root 1 0 R /Size 5 >>
startxref
312
%%EOF
`;

    fs.writeFileSync(filePath, pdfContent);
  } else {
    fs.writeFileSync(filePath, `random-content-${unique}`);
  }

  return filePath;
}
