

const parseString = (str) => {
  str = str.replace(/ *\([^)]*\) */g, "").toLowerCase();
  str+=" ";
  console.log(str);
  let arr = new Array();
  for(i=0;i<str.length;) {
    if(str[i]=='m') {arr.push('m');i++;}
    else if(str[i]=='t' && str[i+1]!='h') {arr.push('t');i++;}
    else if(str[i]=='w') {arr.push('w');i++;}
    else if(str[i]=='t') {arr.push("th");i+=2;} // th
    else if(str[i]=='f') {arr.push('f');i++;}
    else if(str[i]>='0' && str[i]<='9') {
      let num = str[i++];
      if(str[i]>='0' && str[i]<='9') num += str[i++];
      i++; // :
      arr.push(num);
      num = str[i++];
      if(str[i]>='0' && str[i]<='9') num += str[i++];
      arr.push(num);
    } else i++;
  }
  return arr;
}

// interval bitmap of M 00:00-00:05 till F 23:55-00:00
const getBitmap = (bitmap,str) => {
  let arr = parseString(str)
  console.log(arr);
  for(i=0;i<arr.length;i++) {
    let daysOff = new Array();
    for(;;i++) {
      let dayOff;
      if(arr[i]=='m') dayOff=0;
      else if(arr[i]=='t') dayOff=288;
      else if(arr[i]=='w') dayOff=576;
      else if(arr[i]=="th") dayOff=864;
      else if(arr[i]=='f') dayOff=1152;
      else break;
      daysOff.push(dayOff)
    }
    const startOff = (Number(arr[i++])*12) + Number(arr[i++])/5; 
    const endOff = (Number(arr[i++])*12) + Number(arr[i])/5;
    console.log(daysOff+" "+startOff+" "+endOff);
    daysOff.forEach(dayOff => {
      let update = ""
      update = update.padStart(endOff-startOff,'1');
      bitmap = bitmap.substring(0, dayOff+startOff) + update + bitmap.substring(dayOff+endOff)
    });
  }
  return bitmap;
}


let bitmap = ""
bitmap = bitmap.padStart(1440,'0');
let test = `M (L17) W (L17) F (L17) 09:00-10:00, Th 1:00-2:45`;
test = test.replace(/(\r\n|\n|\r)/gm, ""); // remove newlines
console.log(test);
bitmap = getBitmap(bitmap,test);
console.log(bitmap);

