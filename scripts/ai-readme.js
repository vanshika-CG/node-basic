import fs from "fs";
import path from "path";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function collectFiles(dir, limit = 8000) {
  let content = "";
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (
      file === "node_modules" ||
      file === ".git" ||
      file.endsWith(".lock")
    ) continue;

    if (fs.statSync(full).isDirectory()) {
      content += collectFiles(full, limit);
    } else {
      const data = fs.readFileSync(full, "utf8");
      if (content.length + data.length < limit) {
        content += `\n---\nFILE: ${file}\n${data}`;
      }
    }
  }
  return content;
}

const context = collectFiles(process.cwd());

const prompt = `
You are a senior software engineer.
Analyze the following repository and generate a PROFESSIONAL, ACCURATE README.md.

Include:
- Project purpose
- Features
- Tech stack
- Installation
- Usage examples
- Folder structure
- Configuration
- API (if any)
- License

Repository content:
${context}
`;

const response = await client.chat.completions.create({
  model: "gpt-4.1",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.2,
});

fs.writeFileSync("README.md", response.choices[0].message.content);
console.log("README generated using AI");
