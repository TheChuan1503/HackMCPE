const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const logPath = path.join(__dirname, 'compressed.json');

function getCompressedList() {
    if (fs.existsSync(logPath)) {
        try {
            return JSON.parse(fs.readFileSync(logPath, 'utf8'));
        } catch (e) {
            return [];
        }
    }
    return [];
}

function saveCompressedList(list) {
    fs.writeFileSync(logPath, JSON.stringify(list, null, 2), 'utf8');
}

async function compressImages() {
    const compressedList = getCompressedList();
    const files = fs.readdirSync(__dirname);
    
    const imageExtensions = ['.jpg', '.jpeg', '.png'];
    const imagesToProcess = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext) && !compressedList.includes(file);
    });

    if (imagesToProcess.length === 0) {
        console.log('Finished. No new images to compress.');
        return;
    }

    for (const file of imagesToProcess) {
        const inputPath = path.join(__dirname, file);
        const fileExt = path.extname(file).toLowerCase();
        
        const outputName = fileExt === '.jpg' || fileExt === '.jpeg' 
            ? file 
            : `${path.basename(file, fileExt)}.jpg`;
        const outputPath = path.join(__dirname, outputName);

        try {
            const tempOutputPath = outputPath + '.tmp';

            await sharp(inputPath)
                .resize({
                    width: 1280,
                    height: 1280,
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({
                    quality: 80,
                    chromaSubsampling: '4:4:4',
                    force: true
                })
                .toFile(tempOutputPath);

            fs.unlinkSync(inputPath);

            fs.renameSync(tempOutputPath, outputPath);

            compressedList.push(file);
            if (file !== outputName && !compressedList.includes(outputName)) {
                compressedList.push(outputName);
            }
            console.log(`Compressed: ${file}`);
        } catch (err) {
            console.error(`Failed to compress ${file}:`, err);
        }
    }

    saveCompressedList(compressedList);
    console.log('Finished.');
}

compressImages();