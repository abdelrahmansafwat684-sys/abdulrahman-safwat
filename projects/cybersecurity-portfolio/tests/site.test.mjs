import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const HOST = 'abdelrahmansafwat684-sys';
const repo = `https://github.com/${HOST}/abdulrahman-safwat`;

const checks = [
  ['name present', () => assert.match(html, /Abdulrahman Safwat/i)],
  ['four project cards', () => assert.equal((html.match(/class="project (?:project-featured|small-project)"/g) || []).length, 4)],
  ['CloudGuard project', () => assert.match(html, /CloudGuard/)],
  ['GCP automation project', () => assert.match(html, /GCP Security/)],
  ['Triage project', () => assert.match(html, /Vulnerability(?:<br>|\s+)Triage/)],
  ['security toolkit project', () => assert.match(html, /Security Review/)],
  ['CloudGuard live demo link', () => assert.ok(html.includes(`https://${HOST}.github.io/abdulrahman-safwat/`))],
  ['GCP project correct source', () => assert.ok(html.includes(`${repo}/tree/main/projects/gcp-security-automation`))],
  ['Vulnerability Triage source', () => assert.ok(html.includes(`${repo}/tree/main/projects/vulnerability-triage`))],
  ['Security Review source', () => assert.ok(html.includes(`${repo}/tree/main/security-toolkit`))],
  ['Case study link', () => assert.ok(html.includes(`${repo}/blob/main/projects/cloud-posture-dashboard/CASE_STUDY.md`))],
  ['README link to deployed portfolio route', () => assert.ok(readme.includes('/abdulrahman-safwat/portfolio/'))],
  ['document lang', () => assert.match(html, /<html lang="en">/)],
  ['mobile viewport', () => assert.match(html, /name="viewport"/)],
  ['skip to content', () => assert.match(html, /class="skip" href="#main"/)],
  ['external links protected', () => { for (const match of html.matchAll(/<a[^>]+target="_blank"[^>]*>/g)) assert.match(match[0], /rel="noopener noreferrer"/); }],
  ['no HTML forms', () => assert.doesNotMatch(html, /<form[\s>]/i)],
  ['no credential-like content', () => assert.doesNotMatch(html, /(?:AIza[\w-]{25,}|-----BEGIN PRIVATE KEY-----|github_pat_[\w-]{12,})/)],
  ['fictional-data notice', () => assert.match(html, /simulated data|fictional|synthetic/i)],
  ['author email', () => assert.ok(html.includes('mailto:abdelrahmansafwat684@gmail.com'))],
  ['filters wired', () => assert.match(script, /applyFilter\(button\.dataset\.filter\)/)],
  ['filters accessible', () => assert.match(script, /aria-pressed/)],
  ['mobile menu ARIA', () => assert.match(script, /aria-expanded/)],
  ['reduced motion support', () => assert.match(css, /prefers-reduced-motion/)],
  ['responsive breakpoint', () => assert.match(css, /@media\s*\(max-width:/)],
  ['focus style', () => assert.match(css, /focus-visible/)],
];
for(const [name,fn] of checks) test(name,fn);
