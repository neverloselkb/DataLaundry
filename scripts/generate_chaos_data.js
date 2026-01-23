
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../test_data');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

const ROWS = 1000;

// Helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomStr = (len) => Math.random().toString(36).substring(2, 2 + len);

// --- Chaos Generators ---

// 1. Shopping
const generateShopping = () => {
    const data = ['OrderDate,OrderId,TrackingNumber,Customer,Status'];
    for (let i = 0; i < ROWS; i++) {
        const date = `2024-${randomInt(1, 12).toString().padStart(2, '0')}-${randomInt(1, 28).toString().padStart(2, '0')}`;

        let orderId = randomInt(100000, 999999).toString();
        const ordType = Math.random();
        if (ordType < 0.2) orderId = `#${orderId}`;
        else if (ordType < 0.4) orderId = `ORD-${orderId}`;
        else if (ordType < 0.6) orderId = `[${orderId}]`;
        else if (ordType < 0.8) orderId = `${orderId}*`;

        let trackNum = randomInt(1000000000, 9999999999).toString() + randomInt(10, 99).toString();
        const trkType = Math.random();
        if (trkType < 0.3) { // Scientific
            trackNum = `${trackNum[0]}.${trackNum.slice(1, 4)}E+11`;
        } else if (trkType < 0.6) { // Hyphens
            trackNum = trackNum.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
        } else if (trkType < 0.8) { // Spaces
            trackNum = trackNum.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
        }

        data.push(`${date},"${orderId}","${trackNum}",User${i},PaymentCompleted`);
    }
    fs.writeFileSync(path.join(OUTPUT_DIR, 'shopping_chaos.csv'), data.join('\n'));
    console.log('Generated shopping_chaos.csv');
};

// 2. Tax/Accounting
const generateTax = () => {
    const data = ['Date,Description,SupplyValue,TaxAmount,Total'];
    for (let i = 0; i < ROWS; i++) {
        const Y = 2024;
        const M = randomInt(1, 12).toString().padStart(2, '0');
        const D = randomInt(1, 28).toString().padStart(2, '0');

        let dateStr = `${Y}-${M}-${D}`;
        const dType = Math.random();
        if (dType < 0.3) dateStr = `${Y}.${M}.${D}`;
        else if (dType < 0.6) dateStr = `${Y}/${M}/${D}`;
        else if (dType < 0.8) dateStr = `${Y}${M}${D}`;

        const price = randomInt(10, 500) * 1000;
        let tax = Math.floor(price * 0.1);

        // Randomly make tax represent a deduction/negative
        if (Math.random() < 0.3) {
            tax = -tax;
        }

        let taxStr = tax.toString();
        if (tax < 0) {
            const absTax = Math.abs(tax);
            const tType = Math.random();
            if (tType < 0.33) taxStr = `(${absTax.toLocaleString()})`;
            else if (tType < 0.66) taxStr = `△${absTax.toLocaleString()}`;
            else taxStr = `-${absTax.toLocaleString()}`; // Standard
        } else {
            taxStr = tax.toLocaleString();
        }

        data.push(`"${dateStr}",Item ${i},${price},"${taxStr}",${price + tax}`);
    }
    fs.writeFileSync(path.join(OUTPUT_DIR, 'tax_chaos.csv'), data.join('\n'));
    console.log('Generated tax_chaos.csv');
};

// 3. Real Estate
const generateRealEstate = () => {
    const data = ['PropertyName,Type,SupplyArea,Price'];
    for (let i = 0; i < ROWS; i++) {
        const areaBase = randomItem([59, 84, 112, 135]);
        const noise = (Math.random() * 5).toFixed(2);
        const areaVal = (areaBase + parseFloat(noise)).toFixed(2);

        let areaStr = areaVal;
        const aType = Math.random();
        if (aType < 0.2) areaStr = `${areaVal}m2`;
        else if (aType < 0.4) areaStr = `${areaVal} sqm`;
        else if (aType < 0.6) {
            // Convert to pyeong roughly / 3.3
            const pyeong = (parseFloat(areaVal) / 3.3).toFixed(1);
            areaStr = `${pyeong}평`;
        } else if (aType < 0.8) {
            const pyeong = (parseFloat(areaVal) / 3.3).toFixed(1);
            areaStr = `${pyeong}py`;
        }

        data.push(`Property ${i},Apartment,"${areaStr}",${randomInt(5, 20)}00000000`);
    }
    fs.writeFileSync(path.join(OUTPUT_DIR, 'real_estate_chaos.csv'), data.join('\n'));
    console.log('Generated real_estate_chaos.csv');
};

// 4. Marketing
const generateMarketing = () => {
    const data = ['Channel,AccountID,Hashtags,Engagement'];
    for (let i = 0; i < ROWS; i++) {
        const id = `user_${randomStr(5)}`;
        let idStr = id;
        const iType = Math.random();
        if (iType < 0.3) idStr = `@${id}`;
        else if (iType < 0.6) idStr = `https://instagram.com/${id}`;
        else if (iType < 0.8) idStr = `${id} (official)`;

        const tagList = ['fashion', 'ootd', 'daily', 'style', 'korea', 'seoul', 'food', 'cafe'];
        const numTags = randomInt(2, 5);
        let tags = [];
        for (let k = 0; k < numTags; k++) tags.push(randomItem(tagList));

        let tagStr = '';
        const tType = Math.random();
        if (tType < 0.3) tagStr = tags.map(t => `#${t}`).join(' ');
        else if (tType < 0.6) tagStr = tags.join(', ');
        else if (tType < 0.8) tagStr = tags.join('|');
        else tagStr = tags.map(t => `#${t}`).join(',');

        data.push(`Instagram,"${idStr}","${tagStr}",${randomInt(100, 50000)}`);
    }
    fs.writeFileSync(path.join(OUTPUT_DIR, 'marketing_chaos.csv'), data.join('\n'));
    console.log('Generated marketing_chaos.csv');
};

generateShopping();
generateTax();
generateRealEstate();
generateMarketing();
