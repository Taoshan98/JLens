import { XMLParser } from 'fast-xml-parser';

const html = `<!DOCTYPE html>
<html>
<body>
  <div>Line 1<br>Line 2</div>
  <img src="image.png">
  <hr>
</body>
</html>`;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  htmlEntities: true,
  unpairedTags: ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr", "!DOCTYPE"],
  stopNodes: ["script", "style"]
});

// Remove doctype for better parsing chance
const input = html.replace(/<!DOCTYPE.*?>/i, '');

try {
  const result = parser.parse(input);
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error("Error parsing HTML:", e.message);
}
