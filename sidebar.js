const fs = require("fs");

const dir = fs.readdirSync("./docs");
let output = "";
for (const file of dir.sort()) {
    if (file.endsWith(".md") && file !== "_sidebar.md") {
        const content = fs.readFileSync(`./docs/${file}`, { encoding: 'utf8' });
        const title = content.match(/# (.*)\s*\n/);
        if (title) {
            output += `* [${title[1]}](${file})\n`;
        } else {
            output += `* [${file}](${file})\n`;
        }
    }
}
fs.writeFileSync('./docs/_sidebar.md', output, { encoding: 'utf8' });

