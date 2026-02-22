
const removeHtmlRegex = /<[^>]*>?/gm;
const removeEmojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;

const testHTML = "<div>Hello</div> <br> <span>World</span> <a href='#'>Link</a> Unclosed <tag";
const testEmoji = "Hello 😊 Fire 🔥 Rocket 🚀 Text";
const testMixed = "<div>Start ✨</div>";

console.log("--- HTML Removal Test ---");
console.log("Original:", testHTML);
console.log("Result:  ", testHTML.replace(removeHtmlRegex, ''));

console.log("\n--- Emoji Removal Test ---");
console.log("Original:", testEmoji);
console.log("Result:  ", testEmoji.replace(removeEmojiRegex, ''));

console.log("\n--- Mixed Test ---");
console.log("Original:", testMixed);
let val = testMixed;
val = val.replace(removeHtmlRegex, '');
val = val.replace(removeEmojiRegex, '');
console.log("Result:  ", val);
