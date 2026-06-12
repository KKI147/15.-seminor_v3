/**
 * 브라우저 스모크 테스트 — node scripts/test-browser.mjs
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const base = process.env.TEST_URL || 'http://localhost:3456';
const errors = [];
const logs = [];

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('pageerror', function (err) {
        errors.push('pageerror: ' + err.message);
    });
    page.on('console', function (msg) {
        if (msg.type() === 'error') {
            logs.push('console.error: ' + msg.text());
        }
    });

    const res = await page.goto(base + '/index.html', { waitUntil: 'networkidle', timeout: 60000 });
    if (!res || !res.ok()) {
        throw new Error('index.html load failed: ' + (res ? res.status() : 'no response'));
    }

    await page.waitForSelector('#defense-demo', { timeout: 45000 });
    await page.waitForSelector('#defense-demo canvas', { timeout: 45000 });
    await page.waitForTimeout(2000);

    const initState = await page.evaluate(function () {
        const demo = document.getElementById('defense-demo');
        const canvas = document.querySelector('#defense-demo canvas');
        const mapOk = !!document.querySelector('#defense-demo .game-stage.map-gym');
        const btnLegend = document.getElementById('btn-legendary-combo');
        return {
            hasDemo: !!demo,
            hasCanvas: !!canvas,
            mapGym: mapOk,
            hasLegendaryBtn: !!btnLegend,
            hasDefenseDemoApi: typeof window.DefenseDemo !== 'undefined',
            msg: document.getElementById('demo-msg') ? document.getElementById('demo-msg').textContent : ''
        };
    });

    console.log('init:', JSON.stringify(initState, null, 2));

    if (!initState.hasDemo) {
        errors.push('missing #defense-demo');
    }
    if (!initState.hasCanvas) {
        errors.push('missing Pixi canvas');
    }
    if (initState.msg && initState.msg.indexOf('초기화 실패') >= 0) {
        errors.push('init message: ' + initState.msg);
    }

    if (initState.hasLegendaryBtn) {
        await page.click('#btn-legendary-combo');
        await page.waitForTimeout(500);
        const panelVisible = await page.isVisible('#legendary-overlay');
        const recipeCount = await page.locator('.legendary-recipe').count();
        console.log('legendary panel:', panelVisible, 'recipes:', recipeCount);
        if (!panelVisible) {
            errors.push('legendary overlay not visible');
        }
        if (recipeCount !== 5) {
            errors.push('expected 5 legendary recipes, got ' + recipeCount);
        }
        await page.click('#btn-legendary-close');
    }

    await page.click('#btn-gacha');
    await page.waitForTimeout(1500);
    const afterGacha = await page.evaluate(function () {
        const tray = document.getElementById('gacha-tray');
        const cards = tray ? tray.querySelectorAll('.storage-card').length : 0;
        return { cards: cards, msg: document.getElementById('demo-msg').textContent };
    });
    console.log('after gacha:', afterGacha);

    await page.click('#btn-storage-deploy-all');
    await page.waitForTimeout(800);

    await page.click('#btn-start');
    await page.waitForTimeout(2000);
    const afterStart = await page.evaluate(function () {
        return {
            msg: document.getElementById('demo-msg').textContent,
            wave: document.getElementById('demo-wave-info').textContent,
            unitsOnGrid: document.querySelectorAll('#defense-demo .grid-cell.occupied').length
        };
    });
    console.log('after start:', afterStart);
    if (afterStart.unitsOnGrid < 1) {
        errors.push('일괄배치 후 말판 타워 없음');
    }

    await page.click('#btn-reset');
    await page.waitForTimeout(500);

    const mapRes = await page.goto(base + '/assets/map-gym-field.png', { timeout: 15000 });
    if (!mapRes || !mapRes.ok()) {
        errors.push('map png http ' + (mapRes ? mapRes.status() : 'fail'));
    }

    await browser.close();

    if (logs.length) {
        console.log('console errors:', logs);
        errors.push.apply(errors, logs);
    }

    if (errors.length) {
        console.error('\nBrowser test FAILED:');
        errors.forEach(function (e) { console.error(' -', e); });
        process.exit(1);
    }
    console.log('\nBrowser test passed.');
}

main().catch(function (e) {
    console.error(e);
    process.exit(1);
});
