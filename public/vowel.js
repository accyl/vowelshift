class IPACharset {
  constructor() {}
  idxToInt(frontedness, closedness, rounded) {
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
  toChar(frontedness, closedness, rounded) {
    var searchidx = this.idxToInt(frontedness, closedness, rounded);
    var ipachar = this.rfncstr[searchidx];
    if(ipachar === '.') {
      // i use '.' to signify no result
      console.log(`invalid char ${frontedness},${closedness},${rounded}`)
    } else {
      return ipachar;
    }
  }
  charToIdx(charseq, rfncstr=undefined) {

    // REQUIREMENT: In rfncstr,
    //  all chars must appear once and only once.
    // EXCEPTION: the blank char '.' may appear more than once.
    // EXCEPTION: chars may appear twice if and only if they
    //  appear twice in a row, directly adjacent to each other,
    //  indicating that that char represents both the
    //  rounded and unrounded versions of itself.
    //  For example, ʊ shows up in rfncstr
    //  ɪʏʊʊe because ʊ is both the rounded and unrounded version

    // check for those two-char adjacencies, indicating
    // both rounded and unrounded version.
    // Thus roundedness must be 0.5;

    if(rfncstr === undefined) {
      rfncstr = this.rfncstr;
    }
    var idxdouble = rfncstr.indexOf(charseq + '' + charseq);
    var rounded = -1;
    if(idxdouble > -1) { // if there is a double version: if both r and unr
      rounded = 0.5;
    }
    var idx = rfncstr.indexOf(charseq);
    if(idx > -1) {
      if(rounded === -1) {
        var rounded = idx % 2;
      }
      var backidx = parseInt(idx/2) % 5;
      var openidx = parseInt(idx/10);
      var closedness = (6 - openidx) / 2;
      var frontedness = (4 - backidx) / 2;
      return [frontedness, closedness, rounded];
    } else {
      console.log(`char not found ${charseq}`);
    }
  }
  isValid(charseq) {
    return Boolean(this.charToIdx(charseq));
  }
}
var basic_validchars = 'iyɨʉɯuɪʏʊeøɘɵɤoəɛœɜɞʌɔæɐaɶɑɒ'.split('');
class IPACharsetBasic extends IPACharset {
  constructor() {
    super();
    this.rfncstr =
    'iy..ɨʉ..ɯu'+
    '..ɪʏ..ʊʊ..'+
    'eø..ɘɵ..ɤo'+
    '....əə....'+
    'ɛœ..ɜɞ..ʌɔ'+
    'ææ..ɐɐ....'+
    'aɶ......ɑɒ';
    this.validchars = basic_validchars;
  }
}
var adv_extras = ['ä','e̞','ø̞','ɤ̞','o̞'];
var adv_validchars = basic_validchars.concat(adv_extras);
class IPACharsetAdvanced extends IPACharsetBasic{
  constructor() {
    super();
    this.rfncstr =
    'iy..ɨʉ..ɯu'+
    '..ɪʏ..ʊʊ..'+
    'eø..ɘɵ..ɤo'+
    '....əə....'+
    'ɛœ..ɜɞ..ʌɔ'+
    'ææ..ɐɐ....'+
    'aɶ..ä...ɑɒ';
    this.lowerset =
    '..........'+
    '..........'+
    '..........'+
    'eø......ɤo'+
    '..........'+
    '..........'+
    '..........';
    this.lowerchar = "\u031E";
    this.validchars = adv_validchars;
  }
  toChar(frontedness, closedness, rounded) {
    var idx = this.idxToInt(frontedness, closedness, rounded)
    if(this.lowerset[idx] !== '.') {
      // if we're looking at a diacritic-able
      return this.lowerset[idx] + this.lowerchar;
    } else {
      return super.toChar(frontedness, closedness, rounded);
    }
  }
  charToIdx(charseq) {
    if(charseq.length === 2) {
      // diacritic moment
      var norm = charseq[0];
      var dia = charseq[1];
      if (dia === this.lowerchar) {
        // diacritic moment moment

        // use lowerset as our rfncstr.
        // Since the second character was a diacritic, we look for the first
        // character, our "normal" character, like ø, in lowerset.
        // we do a check. first make sure it's not a period:
        if(norm === '.') {
          console.log(`char not found ${charseq}`);
          return;
        }
        // then we make sure ø or Θ is in lowerset
        if(this.lowerset.includes(norm)) {
          // If it was found in lowerset, then
          // Our normal character will be in the correct specified
          // position and will return clo, fro, ro.
          return super.charToIdx(norm, this.lowerset);
        } else {
          // if our input was something dumb like ̞Θ, where the char isn't a vowel
          console.log(`char not found ${charseq}`);
          return;
        }

      }
    } else {
      return super.charToIdx(charseq);
    }
  }
}

const basic_charset = new IPACharsetBasic();
const adv_charset = new IPACharsetAdvanced();
var charset = basic_charset;

const breve = "\u0361";
const lowerchar = "\u031E";

function init() { // called on page load
  console.log("init()");
  var checkbox = document.getElementById('checkbox')
  checkbox.addEventListener('change', (event) => {
    if (event.currentTarget.checked) {
      charset = adv_charset;
      createAdvBoxes();
    } else {
      charset = basic_charset;
      removeAdvBoxes();
    }
  });
  createBoxes();
}
function createBoxes(charsetin) {
  if(charsetin === undefined) {
    charsetin = charset;
    if(charset === adv_charset) {
      // TODO: doesn't work yet, the advanced boxes aren't given a adv class
      console.log("Unready to use advanced charset: advanced boxes aren't given a adv class! ")
    }
  }
  for(let charseq of charsetin.validchars) {
    var [frontedness, closedness, rounded] = charToIdx(charseq);
    addBox(charseq, frontedness, closedness, rounded);
  }
}
function createAdvBoxes(charsetin) {
  for(let charseq of adv_extras) {
    var [frontedness, closedness, rounded] = charToIdx(charseq);
    addBox(charseq, frontedness, closedness, rounded, true);
  }
}
function removeAllBoxes() {
  var boxes = document.getElementsByClassName("mvbl ixv ipa");
  while(boxes.length){ // see https://stackoverflow.com/questions/18410450/javascript-not-removing-all-elements-within-a-div
    boxes[0].parentNode.removeChild(boxes[0]);
  }
}
function removeAdvBoxes() {
  var boxes = document.getElementsByClassName("mvbl ixv ipa adv");
  while(boxes.length){
    boxes[0].parentNode.removeChild(boxes[0]);
  }
}
function addVowel(divclass, str, frontedness, closedness, rounded, extra='') {
  document.getElementsByClassName("vowelspace")[0].innerHTML
   += `<div class="${divclass}" ${extra} style="--fronted: ${frontedness}/2; --closed: ${closedness}/3; --rounded: ${rounded};">${str}</div>`
}
function addBox(char, frontedness, closedness, rounded, adv=false) {
  addVowel(`mvbl ixv ipa${adv ? " adv" : ""}`, char,
  frontedness, closedness, rounded,
  `id="v${frontedness}-${closedness}-${rounded}""`);
}
function addDot(frontedness, closedness) {
  // document.getElementsByClassName("vowels")[0].innerHTML
  //  += "<div class=\"arbitrarydot\" "
  //  + "style=\"--closed: "+closedness+"/3; "
  //  + "--fronted: "+frontedness+"/2;"
  //  + "--rounded: 0.5;"
  //  +  "\">•</div>";
  addVowel('arbitrarydot', '•', frontedness, closedness, 0.5);
}

function fragmentize(str, charsetin) {
  if(charsetin === undefined) {
    charsetin = charset;
  }
  var frags = []; // an array of string fragments, each of which represent either nonrecognized characters or a vowels
  // for example ['f','ɜ','rm','ə','r' ]
  var buildup = '';

  for(let i=0;i<str.length;i++) { // TODO: split by diacritic
    let char = str[i];
    if(i+1 < str.length) {
      // lookahead
      if (str[i+1] === lowerchar) {
        let seq = str.slice(i, i+1+1); // we have our sequence
        if(charset.charToIdx(seq)) { // if our diacritical mark is valid
          if(buildup) {
            frags.push(buildup);
          }
          frags.push(seq);
          buildup = '';
          i++;
          continue; // continue as , skipping one since we already parsed 2
        } else {
          buildup = buildup + '' + seq;
          // our diacritic mark was invalid!
          // dump the whole vowel/diacritic pair.
          // skip an extra one
          i++;
          continue;
        }
        // either way, we
      } else if(str[i+1] === breve) {
        // cool affricate notation that
        // originally mentioned here https://www.reddit.com/r/linguistics/comments/lml34c/i_have_made_the_quick_brown_fox_of_vowel_phonemes/gny6pq7
        if(i+2 < str.length) {
          // we have space to form the combination of 3
          if(charToIdx(str[i]) && charToIdx([str[i+2]])) {
            // if both vowels are valid
            let seq;
            if(i+3 < str.length && str[i+3] === lowerchar) {
              // hacky fix to make diphthongs work with those advanced vowels that get lowered
              seq = str.slice(i, i+2+2);
            } else  {
              seq = str.slice(i, i+2+1);
            }
            if(buildup) {
              frags.push(buildup);
            }
            frags.push(seq);
            buildup = '';
            i+=2; // skip 2 extra
            continue;
          }
        }

      }
    }
    if (charset.validchars.indexOf(char) > -1) { // if char found; if vowel
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
function removeAnalyte() {
  var node = document.getElementsByClassName("analyte")[0];
  while (node.hasChildNodes()) {
    node.removeChild(node.lastChild);
  }
}
function onSubmit() {

  var querystr = document.getElementsByClassName("analyzer")[0].value;
  console.log(querystr);
  var htmlbuild = " ";
  removeAnalyte();
  var frags = fragmentize(querystr, charset);
  for(let frag of frags) {
    if(frag.length === 3 && frag[1] === breve && charset.isValid(frag[0]) && charset.isValid(frag[2])) {
      // affricate tie.
      // highlight both at the same time
      htmlbuild += `<span class="speci" onmouseover="onIn('${frag[0]}', '${frag[2]}')" onmouseout="onOut('${frag[0]}', '${frag[2]}')">${frag}</span>`;
    } else if((frag.length === 2 && frag[1] === lowerchar
      || frag.length === 1) && charset.isValid(frag)) {
      // if it's a valid
      // TODO: investigate XSS here. I think we should be relatively safe becuase it's only 1 char? (Famous Last Words)
      htmlbuild += `<span class="speci" onmouseover="onIn('${frag}')" onmouseout="onOut('${frag}')">${frag}</span>`;
    } else {
      htmlbuild += frag;
    }
  }
  // console.log(htmlbuild);
  document.getElementsByClassName("analyte")[0].innerHTML += htmlbuild; // TODO XSS
  document.getElementsByClassName("analyte-div")[0].style.visibility = 'visible';
}
function onIn(ipachar, ipa2) {onHover(ipachar, true);if(ipa2) onHover(ipa2, true);}
function onOut(ipachar, ipa2) {onHover(ipachar, false);if(ipa2) onHover(ipa2, false);}
function onHover(ipachar, doHover) {
  var [fro, clo, ro] = charToIdx(ipachar);
  var ele = idxToElement(fro, clo, ro);
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
var validchars = 'iyɨʉɯuɪʏʊʊeøɘɵɤoəəɛœɜɞʌɔææɐɐaɶɑɒ';
function toChar(frontedness, closedness, rounded) {
  return charset.toChar(frontedness, closedness, rounded);
}
function charToIdx(ipachar) {
  return charset.charToIdx(ipachar);
}
function idxToElement(frontedness, closedness, rounded) {
  if(rounded === 0.5) {
    // rounded = 0;
    // nah it's initialized by charToIdx() so it expects 0.5

  }
  // actually some don't work.
  // For instance the schwa ə, if referred to as
  // closed: 1.5 front: 1 rounded: 0
  // doesn't work, because it expects rounded: 0.5
  // therefore to make it work we make idxs -> char
  // (which char is guaranteed b/c surjective)
  // then char -> idxs (think of this as the "principal root, if you will")
  // and in total idxs -> principle idxs
  var ipachar = toChar(frontedness, closedness, rounded);
  var [frontedness, closedness, rounded] = charToIdx(ipachar);
  return document.getElementById(`v${frontedness}-${closedness}-${rounded}`)
}
var closedstr = ["open", "near-open", "open-mid", "mid", "close-mid", "near-close"];
var closedupperstr = ["Open", "Near-open", "Open-mid", "Mid", "Close-mid", "Near-close"];
var frontedstr = ["front", "near-front", "central", "near-back", "back"];
function idxToStr(fronted, closed, round) {
  var buildstr = "";
  buildstr += closedupperstr[closed * 2];
  buildstr += " ";
  buildstr += fronstr[fronted * 2];
  buildstr += round ? " rounded" : " unrounded";
  buildstr += " vowel";
}
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
