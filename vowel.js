function init() {
  console.log("init()");
  for(let char of validchars) {
    var [closedness, frontedness, rounded] = charToIdx(char);
    addBox(char, closedness, frontedness, rounded);
  }
}

function addVowel(divclass, str, closedness, frontedness, rounded) {
  document.getElementsByClassName("vowelspace")[0].innerHTML
   += `<div class="${divclass}" style="--closedness: ${closedness}/3; --frontedness: ${frontedness}/2; --rounded: ${rounded};"> ${str}</div>`
}

function addBox(char, closedness, frontedness, rounded) {
  addVowel('positionable interactive IPA', char, closedness, frontedness, rounded);
}
function addDot(closedness, frontedness) {
  // document.getElementsByClassName("vowels")[0].innerHTML
  //  += "<div class=\"arbitrarydot\" "
  //  + "style=\"--closedness: "+closedness+"/3; "
  //  + "--frontedness: "+frontedness+"/2;"
  //  + "--roundedness: 0.5;"
  //  +  "\">•</div>";
  addVowel('arbitrarydot', '•', closedness, frontedness, 0.5);
}

function buttonClick() {
  console.log("buttonClick()");
}
var rfncstr = 'iy..ɨʉ..ɯu..ɪʏ..ʊʊ..eø..ɘɵ..ɤo....əə....ɛœ..ɜɞ..ʌɔææ..ɐɐ....aɶ......ɑɒ';
var validchars = 'iyɨʉɯuɪʏʊʊeøɘɵɤoəəɛœɜɞʌɔææɐɐaɶɑɒ';
function toChar(closedness, frontedness, rounded) {
  var openidx = 6 - closedness * 2;
  // turn the 0.5s into integers. Range: 0-3 -> 0-6 Len: 7
  var backidx = 4 - frontedness * 2;
  // turn the 0.5s into integers. Range: 0-2 -> 0-4 Len: 5
  // Rounded is already ok.       Range: 0-1        Len: 2
  var searchidx = rounded + backidx * 2 + openidx * 2 * 5;
  // 2 comes from len(rounded);
  // 10 comes from len(rounded x fronted) where x is cartesian product
  // or 10 comes from len(rounded) * len(fronted) = 2 * 5
  var ipachar = rfncstr.charAt(searchidx);
  if(ipachar == '.') {
    // i use this value to signify no result
    console.log(`invalid char ${closedness},${frontedness},${rounded}`)
  } else {
    return ipachar;
  }
}
function charToIdx(ipachar) {
  var idxdouble = rfncstr.indexOf(ipachar + '' + ipachar);
  // index of double char. This means that this char spans both
  // the rounded and unrounded versions of itself. For example, ʊ shows up as
  // ɪʏʊʊe because ʊ is both the rounded and unrounded version. If this is the
  // case roundedness must be 0.5;
  var rounded = -1;
  if(idxdouble > -1) { // if there is a double version: if both r and unr
    rounded = 0.5;
  }
  var idx = rfncstr.indexOf(ipachar);
  if(idx > -1) {
    if(rounded === -1) {
      var rounded = idx % 2;
    }
    var backidx = parseInt(idx/2) % 5;
    var openidx = parseInt(idx/10);
    var closedness = (6 - openidx) / 2;
    var frontedness = (4 - backidx) / 2;
    return [closedness, frontedness, rounded];
  } else {
    console.log(`char not found ${char}`);
  }
}
// iy..ɨʉ..ɯu..ɪʏ..ʊʊ..eø..ɘɵ..ɤo....əə....ɛœ..ɜɞ..ʌɔææ..ɐɐ....aɶ......ɑɒ
