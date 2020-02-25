#!/usr/bin/env node

const argv = require("yargs").argv;
const fs = require("fs");
const moment = require("moment");

async function list(path) {
  const dir = fs.opendirSync(path);
  const resultDir = argv.directory || "renamed";
  await fs.promises.mkdir(resultDir, { recursive: true });
  for await (const dirent of dir) {
    const sourceName = dirent.name;
    const nameParts = sourceName.toLowerCase().split(".");
    const extension = nameParts[nameParts.length - 1];

    if (extension === "jpg" || extension === "jpeg") {
      console.log(dirent.name);
      nameParts.pop();
      const filename = nameParts.join(".");
      //   console.log(filename);
      //   console.log(extension);
      const buf = fs.readFileSync(dirent.name);

      const parser = require("exif-parser").create(buf);
      parser.enableSimpleValues(false);
      parser.enableTagNames(true);
      try {
        var result = parser.parse();
        //console.log(result.tags.DateTimeOriginal);
        if (result.tags.DateTimeOriginal) {
          const formattedDateTime = moment(
            result.tags.DateTimeOriginal,
            "YYYY:MM:DD HH:mm:ss"
          )
            .add(argv.addhours || 0, "hours")
            .format("YYYY-MM-DDTHH-mm-ss");
          const newPath = resultDir + "/" + formattedDateTime + ".jpg";
          const exists = fs.existsSync(newPath);
          if (!exists) {
            try {
              console.log(`cp ${sourceName} to ${newPath}`);
              await fs.promises.copyFile(sourceName, newPath);
            } catch (err) {
              console.log(err);
            }
          } else {
            let count = 1;
            while (!tryWrite(sourceName, resultDir, formattedDateTime, count)) {
              count++;
            }
          }
        } else {
          console.log(`${dirent.name} has no date info`);
        }
      } catch (err) {
        // got invalid data, handle error
      }
    }
  }
}

function tryWrite(originalFileName, resultDir, filename, count) {
  const newPath = resultDir + "/" + filename + "-" + count + ".jpg";
  const exists = fs.existsSync(newPath);
  if (!exists) {
    try {
      console.log(`cp ${originalFileName} to ${newPath}`);
      fs.copyFileSync(originalFileName, newPath);
      return true;
    } catch (err) {
      console.log(err);
    }
  } else {
    return false;
  }
}

const a = process.argv[2];

list(".").catch(console.error);
