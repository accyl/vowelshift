class IPACharset {
  constructor() {}
  toChar(closedness, frontedness, rounded) {}
  charToIdx(ipachar) {}
}
class IPACharsetBasic extends IPACharset {
  constructor() {
    super();
    this.rfncstr = 'iy..ɨʉ..ɯu..ɪʏ..ʊʊ..eø..ɘɵ..ɤo....əə....ɛœ..ɜɞ..ʌɔææ..ɐɐ....aɶ......ɑɒ';
  }
  idxsToInt(closedness, frontedness, rounded) {
    if(rounded === 0.5) {
      rounded = 0; // correct for 0.5 for both rounded/unrounded
    }
    var openidx = 6 - closedness * 2;
    // turn the 0.5s into integers. Range: 0-3 -> 0-6 Len: 7
    var backidx = 4 - frontedness * 2;
    // turn the 0.5s into integers. Range: 0-2 -> 0-4 Len: 5
    // Rounded is already ok.       Range: 0-1        Len: 2
    var searchidx = rounded + backidx * 2 + openidx * 2 * 5;
    // 2 comes from len(rounded);
    // 10 comes from len(rounded x fronted) where x is cartesian product
    // or 10 comes from len(rounded) * len(fronted) = 2 * 5
    return searchidx;
  }
  toChar(closedness, frontedness, rounded) {
    var searchidx = idxsToInt(closedness, frontedness, rounded);
    var ipachar = this.rfncstr.charAt(searchidx);
    if(ipachar == '.') {
      // i use this value to signify no result
      console.log(`invalid char ${closedness},${frontedness},${rounded}`)
    } else {
      return ipachar;
    }
  }
  charToIdx(ipachar) {
    var idxdouble = this.rfncstr.indexOf(ipachar + '' + ipachar);
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
}
class IPACharsetAdvanced extends IPACharsetBasic{
  constructor() {
    super();
    this.rfncstr =    'iy..ɨʉ..ɯu..ɪʏ..ʊʊ..eø..ɘɵ..ɤoeø..əə..ɤoɛœ..ɜɞ..ʌɔææ..ɐɐ....aɶ..ä...ɑɒ';
    this.diacritics = '..............................ll......ll...............................';
    this.lower = "\u031E";
  }
  toChar(closedness, frontedness, rounded) {
    var idx = this.idxsToInt(closedness, frontedness, rounded)
    var ch = super.toChar(closedness, frontedness, rounded);
    if(diacritics.charAt(idx) === 'l') {
      return ch + this.lower;
    } else {
      return ch;
    }
  }
}
function init() { // called on page load
  console.log("init()");
  createBoxes(false);
}
function createBoxes(doAdvanced=false) {
  if(doAdvanced) {

  } else {
    for(let char of validchars) {
      var [closedness, frontedness, rounded] = charToIdx(char);
      addBox(char, closedness, frontedness, rounded);
    }
  }
}
function removeAllBoxes() {
  var boxes = document.getElementsByClassName("movable ixv IPA");
  while(boxes.length){ // see https://stackoverflow.com/questions/18410450/javascript-not-removing-all-elements-within-a-div
    boxes[0].parentNode.removeChild(boxes[0]);
  }
}
function addVowel(divclass, str, closedness, frontedness, rounded, extra='') {
  document.getElementsByClassName("vowelspace")[0].innerHTML
   += `<div class="${divclass}" ${extra} style="--closedness: ${closedness}/3; --frontedness: ${frontedness}/2; --rounded: ${rounded};"> ${str}</div>`
}
var tie = "\u0361";
function addBox(char, closedness, frontedness, rounded) {
  addVowel('movable ixv IPA', char,
  closedness, frontedness, rounded,
  `id="v${closedness}-${frontedness}-${rounded}""`);
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

function fragmentize(str) {
  var frags = []; // an array of string fragments, each of which represent either nonrecognized characters or a vowels
  // for example ['f','ɜ','rm','ə','r' ]
  var buildup = '';
  for(let char of str) {
    if (validchars.indexOf(char) > -1) { // if char found; if vowel
      if(buildup) {
        frags.push(buildup);
      }
      frags.push(char);
      buildup = '';
    } else { // if char not found; if consonant
      buildup = buildup + '' + char;
    }
  }
  if(buildup) {
    frags.push(buildup);
  }
  // now we have string fragments
  return frags;
}
function onSubmit() {
  var querystr = document.getElementsByClassName("analyzer")[0].value;
  console.log(querystr);
  var htmlbuild = " ";
  var frags = fragmentize(querystr);
  for(let frag of frags) {
    if(frag.length === 1 && validchars.includes(frag)) {
      // if it's a lone vowel, box it
      // TODO: investigate XSS here. I think we should be relatively safe becuase it's only 1 char? (Famous Last Words)
      htmlbuild += `<span class="alyt" onmouseover="onIn('${frag}')" onmouseout="onOut('${frag}')">${frag}</span>`;
    } else {
      htmlbuild += frag;
    }
  }
  console.log(htmlbuild);
  document.getElementsByClassName("analyte")[0].innerHTML += htmlbuild; // TODO XSS
}
function onIn(ipachar) {onHover(ipachar, true);}
function onOut(ipachar) {onHover(ipachar, false);}
function onHover(ipachar, doHover) {
  var clo, fro, ro;
  [clo, fro, ro] = charToIdx(ipachar);
  var ele = idxToElement(clo, fro, ro);
  if(doHover) {
    if(!ele.classList.contains("hovered")) {
      ele.classList.add("hovered");
    }
  } else {
    if(ele.classList.contains("hovered")) {
      ele.classList.remove("hovered");
    }
  }
}
var rfncstr = 'iy..ɨʉ..ɯu..ɪʏ..ʊʊ..eø..ɘɵ..ɤo....əə....ɛœ..ɜɞ..ʌɔææ..ɐɐ....aɶ......ɑɒ';
var extendd = 'iy..ɨʉ..ɯu..ɪʏ..ʊʊ..eø..ɘɵ..ɤoeø..əə..ɤoɛœ..ɜɞ..ʌɔææ..ɐɐ....aɶ..ä...ɑɒ';
var addlowr = '..............................ll......ll...............................';
// var validcdhars = 'iyɨʉɯuɪʏʊʊeøɘɵɤoəəɛœɜɞʌɔææɐɐaɶɑɒ';
var validchars = 'iyɨʉɯuɪʏʊeøɘɵɤoəɛœɜɞʌɔæɐaɶɑɒ';
var charset = new IPACharsetBasic();
function toChar(closedness, frontedness, rounded) {
  return charset.toChar(closedness, frontedness, rounded);
}
function charToIdx(ipachar) {
  return charset.charToIdx(ipachar);
}
function idxToElement(closedness, frontedness, rounded) {
  if(rounded === 0.5) {
    // rounded = 0;
    // nah it's initialized by charToIdx() so it expects 0.5
  }
  return document.getElementById(`v${closedness}-${frontedness}-${rounded}`)
}
// iy..ɨʉ..ɯu..ɪʏ..ʊʊ..eø..ɘɵ..ɤo....əə....ɛœ..ɜɞ..ʌɔææ..ɐɐ....aɶ......ɑɒ
function removeDup(str) {
  var build = "";
  for(let ipachar of str) {
    if(build.includes(ipachar) || ipachar === '.') {
      // do nothing
    } else {
      build += ipachar;
    }
  }
  return build;
}
var toChar = simpleToChar;
var charToIdx = simpleCharToIdx;
