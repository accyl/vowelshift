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

function setVisible(classname, visible) {
  let el = document.getElementsByClassName(classname)[0];
  if(el === undefined) {
    throw new TypeError("Cannot find element of classname "+ classname);
  }
  if(visible) {
    el.classList.remove("removed");
  } else {
    el.classList.add("removed");
  }
}
function init() { // called on page load
  console.log("init()");
  var checkbox = document.getElementsByClassName('ipa-more')[0];
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
  var gvs = document.getElementsByClassName('gvs-more')[0];
  function doGVS() {
    createTable();
    setVisible("analysis", false);
    setVisible("gvs-div", true);
  }
  gvs.addEventListener('change', (event) => {
    if (event.currentTarget.checked) {
      doGVS();
    } else {
      removeAllChildren();
      setVisible("analysis", true);
      setVisible("gvs-div", false);
    }
  });
  doGVS();
  fociiInit([0,1,1,1,1,1,1,1,0,0,0,0,1,1,1]);
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
  document.getElementsByClassName("movables")[0].innerHTML
   += `<div class="${divclass} fro${frontedness} clo${closedness} ro${rounded}" ${extra}>${str}</div>`
   // style="--fronted: ${frontedness}/2; --closed: ${closedness}/3; --rounded: ${rounded};"
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
function removeResults() {
  var node = document.getElementsByClassName("results")[0];
  while (node.hasChildNodes()) {
    node.removeChild(node.lastChild);
  }
}
function fragmentize(str, charsetin) {
  if(charsetin === undefined) {
    charsetin = charset;
  }
  var frags = []; // an array of string fragments, each of which represent either nonrecognized characters or a vowels
  // for example ['f','ɜ','rm','ə','r' ]
  var buildup = '';
  function pushfrag(frag, vowel=false) {
	if(vowel) {
	  frag["vowel"] = true;
	} else {
	  frag["vowel"] = false;
	}
	frags.push(frag)
  }
  for(let i=0;i<str.length;i++) { // TODO: split by diacritic
    let char = str[i];
    if(i+1 < str.length) {
      // lookahead
      if (str[i+1] === lowerchar) {
        let seq = str.slice(i, i+1+1); // we have our sequence
        if(charset.charToIdx(seq)) { // if our diacritical mark is valid
          if(buildup) {
            pushfrag(buildup);
          }
          pushfrag(seq, true);
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
			  i++;
            } else  {
              seq = str.slice(i, i+2+1);
            }
            if(buildup) {
              pushfrag(buildup);
            }
            pushfrag(seq, true);
            buildup = '';
            i+=2; // skip 2 extra
            continue;
          }
        }

      }
    }
    if (charset.validchars.indexOf(char) > -1) { // if char found; if vowel
      if(buildup) {
        pushfrag(buildup);
      }
      pushfrag(char, true);
      buildup = '';
    } else { // if char not found; if consonant
      buildup = buildup + '' + char;
    }
  }
  if(buildup) {
    pushfrag(buildup);
  }
  // now we have string fragments
  return frags;
}
function onSubmit() {

  var querystr = document.getElementsByClassName("searchbar")[0].value;
  console.log(querystr);
  var htmlbuild = " ";
  removeResults();
  var frags = fragmentize(querystr, charset);
  for(let frag of frags) {
    if((frag.length === 3 || frag.length === 4) && frag[1] === breve && charset.isValid(frag[0]) && charset.isValid(frag.substring(2))) {
      // affricate tie.
      // highlight both at the same time
      htmlbuild += `<span class="speci" onmouseover="onIn('${frag[0]}', '${frag.substring(2)}')" onmouseout="onOut('${frag[0]}', '${frag.substring(2)}')">${frag}</span>`;
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
  document.getElementsByClassName("results")[0].innerHTML += htmlbuild; // TODO XSS
  document.getElementsByClassName("results-div")[0].style.visibility = 'visible';
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
// var rfncstr = 'iy..ɨʉ..ɯu..ɪʏ..ʊʊ..eø..ɘɵ..ɤo....əə....ɛœ..ɜɞ..ʌɔææ..ɐɐ....aɶ......ɑɒ';
// var extendd = 'iy..ɨʉ..ɯu..ɪʏ..ʊʊ..eø..ɘɵ..ɤoeø..əə..ɤoɛœ..ɜɞ..ʌɔææ..ɐɐ....aɶ..ä...ɑɒ';
// var addlowr = '..............................ll......ll...............................';
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
const sample = {};
sample["chaucer"] = "hwɑn θɑt ɑːprɪl wɪθ hɪs ʃuːrəs soːtə"+
"θə druːxt ɔf mɑrt͡ʃ haθ pɛːrsəd toː θə roːtə"+
"ɑnd bɑːðəd ɛvrɪ vɛɪn ɪn swit͡ʃ lɪkuːr"+
"ɔf hwɪt͡ʃ vɛrtɪʊ ɛnjɛndrəd ɪs θə fluːr"+
"hwɑn zəfɪrʊs eːk wɪθ hɪs sweːtə brɛːθ"+
"ɪnspiːrəd hɑθ ɪn ɛvrɪ hɔlt ɑnd hɛːθ";
sample["range"] = "# du kʊk ʌp mɔː brɒθ, fɜrmər, fast ænd lɛt ɪt hiːt. bre͡ɪz, bɔ͡ɪl, fra͡ɪ. na͡ʊ ʃo͡ʊ re͡ə bɪ͡ə kjʊ͡ə";
function randomSampleInput() {
  document.getElementsByClassName("searchbar")[0].value = sample["range"];
}
var prevsliderhov = undefined;
function updateSliderHover() {
  // let slider = document.getElementsByClassName("slide")[0];
  let slider = document.getElementById("a-slide");
  let results = document.getElementsByClassName("results")[0];
  let eqvposx = results.offsetLeft + results.clientLeft + results.clientWidth * slider.value / 100;
  let eqvposy = results.offsetTop - window.pageYOffset;
  let highlightme = document.elementFromPoint(eqvposx, eqvposy);
  if(highlightme) {
    if(highlightme !== prevsliderhov) {
      // a change in slider hovering item
      if(highlightme.classList.contains("speci")) { // only care if we're over a vowel
        if(prevsliderhov) prevsliderhov.onmouseout();

        if(highlightme.onmouseover) highlightme.onmouseover();
        prevsliderhov = highlightme;
      }
    }
  }

}
function createTable(tableData, src, classname) { // https://stackoverflow.com/questions/15164655/generate-html-table-from-2d-javascript-array
  if (tableData === undefined) tableData = gvsarr;
  if (classname === undefined) classname = "tbl-bin";
  if (src === undefined) src = document.getElementsByClassName("defaultbin")[0];// document.body;
  var table = document.createElement('table');
  table.classList.add(classname);
  var tableBody = document.createElement('tbody');

  tableData.forEach(function (rowData) {
    var row = document.createElement('tr');

    rowData.forEach(function (cellData) {
      var cell = document.createElement('td');
      cell.appendChild(document.createTextNode(cellData));
      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });

  table.appendChild(tableBody);
  src.appendChild(table);
}
function removeAllChildren(node) {
  if (node === undefined) node = document.getElementsByClassName("defaultbin")[0];
  while (node.hasChildNodes()) {
    node.removeChild(node.lastChild);
  }
}
const gvs_str = ` ,1400,1500,1550,1600,1650,1700,1750,1800,1850,1900,2000
time,iː,ɪi̯,.,.,əɪ̯,.,ʌɪ̯,.,.,.,aɪ̯
see,eː,iː,.,.,.,iː,.,.,.,.,iː
east,ɛː,e̞ː,.,eː,.,/,.,.,.,.,/
name,aː,æː,.,ɛː,ɛː,.,eː,.,eɪ,.,eɪ
day,æj,æːi,ɛːi,ɛː,/,.,.,.,.,.,/
house,uː,ʊu̯,.,əu̯,.,.,au̯,.,.,.,aʊ̯
moon,oː,uː,.,.,.,.,.,.,.,.,uː
stone,ɔː,.,oː,.,.,o̞ː,.,oːu̯,.,oʊ̯,əʊ̯
know,ɔu̯,ou̯,.,.,.,/,.,.,.,.,/
law,au̯,aːʊ̯/ɔːʊ̯,.,aː/ɔː,.,.,o̞ː,.,.,.,ɔː
new,eu̯/iu̯,i̯uː,.,.,.,juː,.,.,.,.,juː
dew,ɛu̯,eːu̯,iu̯,i̯uː,.,.,.,.,.,.,/
that,a,.,.,æ,.,.,.,.,.,.,æ
fox,o̞,.,.,ɔ/ɒ,.,.,.,.,.,.,ɒ
cut,ʊ,.,.,ɤ,.,.,ʌ̈,.,.,.,ʌ`;
const gvsarr = function() {
  let retn = Array(15);
  let it = 0;
  for(let line of gvs_str.split("\n")) {
    retn[it] = line.split(",");
    it++;
  }
  return retn;
}();
function positionWord(wordidx, dateidx) {
  // TODO This code needs to be VERY performant because it is run a ridiculous number of times - 
  // TODO cache this into an EffectiveTable :tm:
  let j = wordidx;
  let k = dateidx;
  if (k <= 0 || j <= 0) throw new TypeError(`You got the indices mixed up. positionWord() relies on indices of the big gvsarr, which has headers that take up index 0. Thus start your indexes at 1 (eww), or add 1 to whatever index you have.? wordidx=${j} dateidx=${k} ${gvsarr[j]}`);

  let arr = gvsarr[j];
  let sound = arr[k];
  // let date = arr[0][dateidx]; // unused
  while (sound === '.' || sound === '/') {
    while (sound === '.') {
      // Simply ignoring doesn't quite work when you're working backwards.
      // What I think I have to do is if I see a dot I have to go back and
      // until there is a non-dot one.
      k--;
      if (k < 1) {
        throw new TypeError("there's a dot where there shouldn't be? " + arr);
      }
      sound = arr[k];
    }
    while (sound === '/') {
      j--;
      arr = gvsarr[j]; // go to the prev row
      k = dateidx; // we have to start back on the original date, because if we go up that means that
      // Example: name/day, notice what the correct answer for day is for 1750.
      // TODO: mark for merger.
      sound = arr[k];
    }
  }
  if (sound === undefined) throw new TypeError("undefined? " + arr);
  // let lbl = gvsarr[wordidx][0]; // get the original label

  // let focus = focii.fromLabel(lbl);
  // if (focus) {
    let str = gvsarr[j][k];

    let result = charseqToPos(str);

    if (result) {
      return result;
    }
  // }

}
const gvspos = function() {
  let retn = Array(15);
  for (let i=0;i<gvsarr.length;i++) {
    let line = gvsarr[i];
    retn[i] = Array(line.length);
    let copyline = retn[i];
    if(i >= 1) {
      for(let j=0;j<line.length;j++) {
        if(j >= 1) {
          copyline[j] = positionWord(i, j); // cache the positions of all the words
        } else {
          copyline[j] = undefined;
        }
      }
    }
  }
  return retn;
}();
const gvssquished = function() { // at a given idx, explain whether to hide the dates to make more room so divs don't overlap
  let ret = Array(15);
  for(let i=1;i<gvspos.length;i++) {
    for(let j=1;j<gvspos[i].length;j++) {
      
    }
  }
}();
function positionWordCached(wordidx, dateidx) {
  if (wordidx <= 0 || dateidx <= 0) throw new TypeError(`You got the indices mixed up. positionWord() relies on indices of the big gvsarr, which has headers that take up index 0. Thus start your indexes at 1 (eww), or add 1 to whatever index you have.? wordidx=${wordidx} dateidx=${dateidx} ${gvsarr[wordidx]}`);

  return gvspos[wordidx][dateidx];
}
class Focus {
  constructor(lbl, fro, clo, ro, date) {
    this.lbl = lbl;
    this.date = date;
    this.clo = clo;
    this.fro = fro;
    this.ro = ro;
    this.classid = `focus mvbl lbl-${lbl}`;
    this.classfull = this.classid + ` fro${fro} clo${clo} ro${ro}`;
    // this.queryid = "." + this.classid.replace(" ", ".");
    this.hidden = false;
    this.subordinating = "";
    this.embed();
  }
  fullLabel() {
    return this.hidden ? "" : this.lbl + this.subordinating + (this.date ? ` (${this.date})`:"");
    // return this.hidden ? "" : this.lbl + "  "; // remove the date because it takes up valuable space
  }
  embed(parent) {
    let fociis = undefined;
    if(parent === undefined) {
      fociis = document.getElementsByClassName("focii")[0];
    } else {
      fociis = parent;
    }
    let div = document.createElement('div');
    let span = document.createElement('span'); // make new
    fociis.appendChild(div);
    div.appendChild(span);
    span.classList.add("foclbl");

    span.textContent = this.fullLabel();
    div.classList += this.classfull; // TODO use classList addall
    // storing these variables globally in cache seems like a bad idea - vulnerabilities
  }
  update() {
    // let me = document.querySelectorAll(this.queryid);
    // if(this.hidden) return; doesn't let the classes update
    // this.setPos(); // update classfull. TODO perhaps go back to css styling only?

    let me = this.embedPos();
    let span = me.children[0];
    span.textContent = this.fullLabel();
    me.classList = this.classfull;
    return me;
  }
  setPos(fro, clo, ro) {
    if(fro !== undefined) this.fro = fro;
    if(clo !== undefined) this.clo = clo;
    if(ro !== undefined) this.ro = ro;
    // if(!this.hidden) this.classfull = this.classid + ` fro${this.fro} clo${this.clo} ro${this.ro}`;
  }
  embedPos(jsObjMe) {
    if(jsObjMe === undefined) {
      jsObjMe = document.getElementsByClassName(this.classid)[0];
    }
    jsObjMe.style.setProperty("--fronted", this.fro/2);
    jsObjMe.style.setProperty("--closed", this.clo/3);
    jsObjMe.style.setProperty("--rounded", this.ro);
    return jsObjMe;
  }
  hide() {
    this.hidden = true;
    this.classfull = this.classid + " removed";
  }
  unhide() {
    this.hidden = false;
    this.update();
  }
  merge(subordinate) {
    this.unhide();
    subordinate.hide();
    this.subordinating = ", " + subordinate.lbl;
  }
  unmerge(subordinate) {
    this.unhide();
    subordinate.unhide();
    this.subordinating = "";
  }
}
const focii = function() {
  let retn = [];
  retn.fromLabel = function(str) {
    for(let focus of this) {
      if(focus.lbl === str) {
        return focus;
      }
    }
  };
  Object.defineProperty(retn, 'date', {
    get: function() {
      return retn._date;
    },
    set: function(date) {
      return gvsUpdate(this, date);
    }
  });
  return retn;
}();
function fociiInit(tape) {
  // focii.push(new Focus('house', 0, 3, 1, 1400));
  // focii.push(new Focus('name', 2, 0, 0, 1400));
  // focii.push(new Focus('dew', 2, 1, 0, 1400));
  for(let i=1;i<gvsarr.length;i++) {
    let word = gvsarr[i][0];
    focii.push(new Focus(word, 0, 0, 0, -1));
  }
  focii.date = 1400;
  if(tape) {
    for (let i = 0; i < focii.length; i ++) {
      if(!tape[i]) {
        focii[i].hide();
        focii[i].update();
      }
    }
  }
  return;
  gvsUpdate(1400);
}
var gvsdate=1400;
function gvsUpdateSlide() {
  let slider = document.getElementById("gvs-slide");
  let date = slider.value;
  focii.date = date;
  return;
  // gvsdate = date;
  // let change = false;
  // if (date >= gvsdate + 50) {
  //   while(date >= gvsdate + 50) {
  //     gvsdate += 50; // go up in increments of 50
  //   }
  //   change = true;
  // }
  // else if (date <= gvsdate - 50) {
  //   while(date <= gvsdate - 50) {
  //     gvsdate -= 50;
  //   }
  //   change = true;
  // }
  // if(change) {
  //   // document.getElementsByClassName("indicator")[0].innerHTML = gvsdate;
  //   gvsUpdate(gvsdate);
  // }
}
function gvsUpdate(focii, gvsdate) {
  document.getElementById("gvs-date-display").innerText = "(" + gvsdate + ")";
  updateWords(gvsdate);
  return;
  // retn._date = date;
  // if(!gvsdate) {
  //   throw new TypeError(`Invalid date ${gvsdate} in update`)
  // }
  // let idx = gvsarr[0].indexOf(""+gvsdate);
  // // idx 0 is purposely a blank so that the table lines up,
  // //but we also need to skip the header everytime so it cancels each other out
  // if(gvsdate === 1450 || gvsdate === 1950) return; // these ones are the "fake" ones that don't have a slot in the table
  // if(idx === -1) throw new TypeError("index not found?" + idx + " " + gvsdate);
  // if(!(1 <= idx && idx <= 11)) throw new TypeError("bad index? "+ idx + " " + gvsdate);
  // for(j=1;j<gvsarr.length;j++) {
  //   positionWord(j, idx);
  // }
  // focii.date = gvsdate;
}

function updateWords(date, idxStart, idxEnd) {
  // TODO This code needs to be VERY performant because it is run a ridiculous number of times - 
  // Interpolation
  let fh = -1;
  let exact = false;
  for (let i = 0; i < gvsarr[0].length; i++) {
    if (gvsarr[0][i] == date) {
      exact = true;
      fh = i;
      break;
    } else if (gvsarr[0][i] > date) {
      fh = i;
      break;
    }
  }
  if(idxStart === undefined) idxStart = 0;
  if(idxEnd === undefined) idxEnd = focii.length;
  for (let i = idxStart; i < idxEnd; i++) {
    // focus.date = num;
    // focus.update();
    // updateWord(i + 1, gvsdate);
    let wordidx = i + 1; // for some reason I started wordidxs off at 1 because of the weird header offset
    if (fh !== -1) {
      var [fro, clo, ro] = [1, 1, 1];
      if (exact) {
        // let date1 = gvs[0][fh];
        var [fro, clo, ro] = positionWordCached(wordidx, fh);
      } else {
        // found a time scale
        let date1 = gvsarr[0][fh - 1];
        let date2 = gvsarr[0][fh];
        let ddate = date - date1;
        console.assert(ddate <= date2, `Dates not in range ${date1} ${date} ${date2}`);
        let dfrac = ddate / (date2 - date1);
        dfrac = (dfrac < 0.3) ? 0 : (dfrac < 0.7 ? (dfrac - 0.3) / 0.4 : 1); // NON-linear interpolation. 
        // means that it stays at the endpoints - 0 & 1 - for longer so it's easier to see what the IPA symbols are.
        // akin to a tanh function - it's a nonlinearity
        let [fro1, clo1, ro1] = positionWordCached(wordidx, fh - 1);
        let [fro2, clo2, ro2] = positionWordCached(wordidx, fh);
        var [fro, clo, ro] = [fro1 + (fro2 - fro1) * dfrac, clo1 + (clo2 - clo1) * dfrac, ro1 + (ro2 - ro1) * dfrac];
      }
      let focus = focii[wordidx - 1];
      focus.setPos(fro, clo, ro); // TODO give focus a setChar()
      // TODO diphthongs just totally absent. make diphthongs
      focus.date = date;
      focus.update();
    } else {
      throw new TypeError(`date ${date} outside of expected time range?`);
    }


  }
}

function updateWord(date, wordidx) {
  updateWords(date, wordidx, wordidx + 1);
}
function charseqToPos(charseq) {
      // TODO BIG: finish method for turning complicated strings to idxs like "aː/ɔː" instead of my shortcut of looking at first letter. I'm too lazy to right now
    // special characters that don't get parsed correctly: '/' 'j'
  charseq = charseq.replace("ː", "");
  charseq = charseq.replace("j", "i");

  let result = charset.charToIdx(charseq[0]);
  return result;
}
function adjustFocii() {
  // adjust focii to prevent them from overlapping and being illegible.
  // mainly do this through a series of dumb hacky fixes.
  for(let focus of focii) {

  }
}