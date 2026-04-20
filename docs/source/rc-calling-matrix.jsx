import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Lock, Plus, Check, X, Trash2, Users, GripVertical, ChevronDown,
  AlertCircle, FileEdit, Crown, Layers, Search, MoreHorizontal
} from 'lucide-react';

// ----- embedded callings data (imported from the xlsx) -----
const INITIAL_DATA = {"organizations":[{"id":"bishopric","name":"Bishopric","callings":[{"id":"bishopric-c1","title":"Bishop","personId":"matt-brown"},{"id":"bishopric-c2","title":"First Counselor","personId":"ryan-bunker"},{"id":"bishopric-c3","title":"Second Counselor","personId":"matt-stevenson"}]},{"id":"teachers-quorum","name":"TEACHERS QUORUM","callings":[{"id":"teachers-quorum-c1","title":"president","personId":null},{"id":"teachers-quorum-c2","title":"first counselor","personId":"austin-campbell"},{"id":"teachers-quorum-c3","title":"second counselor","personId":"grey-barker"},{"id":"teachers-quorum-c4","title":"secretary","personId":null},{"id":"teachers-quorum-c5","title":"advisor","personId":"cameron-stinson"},{"id":"teachers-quorum-c6","title":"advisor","personId":"ben-barker"},{"id":"teachers-quorum-c7","title":"advisor","personId":"seth-brazier"}]},{"id":"young-women-13-14","name":"YOUNG WOMEN 13-14","callings":[{"id":"young-women-13-14-c1","title":"president","personId":"ruby-wrigt"},{"id":"young-women-13-14-c2","title":"first counselor","personId":"brooklynn-stinson"},{"id":"young-women-13-14-c3","title":"second counselor","personId":"joslyn-reed-berry"},{"id":"young-women-13-14-c4","title":"secretary","personId":"livi-baxter"}]},{"id":"sunday-school","name":"SUNDAY SCHOOL","callings":[{"id":"sunday-school-c1","title":"president","personId":"austin-hyde"},{"id":"sunday-school-c2","title":"first counselor","personId":"parker-smith"},{"id":"sunday-school-c3","title":"second counselor","personId":null},{"id":"sunday-school-c4","title":"secretary","personId":null},{"id":"sunday-school-c5","title":"gospel doctrine teacher","personId":"anessa-gamez"},{"id":"sunday-school-c6","title":"gospel doctrine teacher","personId":"ryan-smith"},{"id":"sunday-school-c7","title":"strengthening marriages","personId":null},{"id":"sunday-school-c8","title":"strengthening marriages","personId":null},{"id":"sunday-school-c9","title":"course 11","personId":"kaden-willie"},{"id":"sunday-school-c10","title":"course 11","personId":"andrew-null"},{"id":"sunday-school-c11","title":"course 12","personId":"mike-heisel"},{"id":"sunday-school-c12","title":"course 12","personId":"yanita-heisel"},{"id":"sunday-school-c13","title":"course 13","personId":"jonathan-gove"},{"id":"sunday-school-c14","title":"course 13","personId":"nate-facuri"},{"id":"sunday-school-c15","title":"course 13","personId":"benjamin-robles"},{"id":"sunday-school-c16","title":"course 15 - 9th graders","personId":"tami-foulger"},{"id":"sunday-school-c17","title":"course 15 - 9th graders","personId":"chris-foulger"},{"id":"sunday-school-c18","title":"course 16/17","personId":"tarah-campbell"},{"id":"sunday-school-c19","title":"course 16/17","personId":"brooke-brown"},{"id":"sunday-school-c20","title":"Resource Center","personId":null},{"id":"sunday-school-c21","title":"Resource Center","personId":null}]},{"id":"emergency-prep","name":"Emergency Prep","callings":[{"id":"emergency-prep-c1","title":"emerg response specialist","personId":null},{"id":"emergency-prep-c2","title":"emerg comms specialist","personId":null}]},{"id":"music","name":"MUSIC","callings":[{"id":"music-c1","title":"ward music chairperson","personId":"vicki-bradford"},{"id":"music-c2","title":"ward choir director","personId":"danica-nelson"},{"id":"music-c3","title":"ward chorister","personId":"vicki-bradford"},{"id":"music-c4","title":"ward music accompianist","personId":null},{"id":"music-c5","title":"ward choir pianist","personId":"emily-roberts"}]},{"id":"employment","name":"EMPLOYMENT","callings":[{"id":"employment-c1","title":"employment specialist","personId":null}]},{"id":"single-adults","name":"SINGLE ADULTS","callings":[{"id":"single-adults-c1","title":"single adult rep","personId":null}]},{"id":"ward-history","name":"WARD HISTORY","callings":[{"id":"ward-history-c1","title":"history specialist","personId":"mayra-thompson"}]},{"id":"friendship-meal-coordination","name":"FRIENDSHIP MEAL COORDINATION","callings":[{"id":"friendship-meal-coordination-c1","title":"coordinator","personId":"ed-cheng"},{"id":"friendship-meal-coordination-c2","title":"coordinator","personId":"stephanie-cheng"}]},{"id":"temple-prep","name":"TEMPLE PREP","callings":[{"id":"temple-prep-c1","title":"instructor","personId":"doug-roberts"},{"id":"temple-prep-c2","title":"instructor","personId":"owen-harris"}]},{"id":"priests-quorum","name":"PRIESTS QUORUM","callings":[{"id":"priests-quorum-c1","title":"president","personId":"matt-brown"},{"id":"priests-quorum-c2","title":"first assistant","personId":"mason-carr"},{"id":"priests-quorum-c3","title":"second assistant","personId":"ethan-mcguire"},{"id":"priests-quorum-c4","title":"secretary","personId":"lucas-campbell"},{"id":"priests-quorum-c5","title":"advisor","personId":"erick-sayer"},{"id":"priests-quorum-c6","title":"advisor","personId":"craig-bruschke"},{"id":"priests-quorum-c7","title":"Quorum Specialiist","personId":null},{"id":"priests-quorum-c8","title":"YM Secretary","personId":"zach-nelson"}]},{"id":"young-women-15-18","name":"YOUNG WOMEN 15-18","callings":[{"id":"young-women-15-18-c1","title":"president","personId":"cami-nelson"},{"id":"young-women-15-18-c2","title":"first counselor","personId":"saylor-brown"},{"id":"young-women-15-18-c3","title":"second counselor","personId":"pearl-smith"},{"id":"young-women-15-18-c4","title":"secretary","personId":"liv-morley"}]},{"id":"clerks-extended-bishopric","name":"CLERKS/EXTENDED BISHOPRIC","callings":[{"id":"clerks-extended-bishopric-c1","title":"executive secretary","personId":"tucker-terhufen"},{"id":"clerks-extended-bishopric-c2","title":"ward clerk","personId":"landon-cline"},{"id":"clerks-extended-bishopric-c3","title":"assistant clerk, finance","personId":"jim-gamez"},{"id":"clerks-extended-bishopric-c4","title":"assistant clerk, members","personId":null}]},{"id":"young-women","name":"YOUNG WOMEN","callings":[{"id":"young-women-c1","title":"president","personId":"shayne-brazier"},{"id":"young-women-c2","title":"first counselor","personId":"erin-shields"},{"id":"young-women-c3","title":"second counselor","personId":"tracy-mathis"},{"id":"young-women-c4","title":"secretary","personId":"danica-nelson"},{"id":"young-women-c5","title":"advisor - HS","personId":"jody-moore"},{"id":"young-women-c6","title":"advisor - HS","personId":"erin-carr"},{"id":"young-women-c7","title":"advisor - Middle","personId":"sara-morley"},{"id":"young-women-c8","title":"advisor- Middle","personId":"celine-stinson"},{"id":"young-women-c9","title":"advisor - Adorables","personId":"sara-huggins"},{"id":"young-women-c10","title":"advisor - Adorables","personId":"cami-bruschke"},{"id":"young-women-c11","title":"camp director","personId":"cami-bruschke"}]},{"id":"elders-quorum","name":"ELDERS QUORUM","callings":[{"id":"elders-quorum-c1","title":"president","personId":"jake-moore"},{"id":"elders-quorum-c2","title":"first counselor - Mission","personId":"james-humberstone"},{"id":"elders-quorum-c3","title":"second counselor - Temple","personId":"aleksander-vasilev"},{"id":"elders-quorum-c4","title":"secretary","personId":"kyle-shields"},{"id":"elders-quorum-c5","title":"Ministering Secretary","personId":"ian-huggins"},{"id":"elders-quorum-c6","title":"instructor","personId":"mike-florence"},{"id":"elders-quorum-c7","title":"instructor","personId":"curtis-layton"},{"id":"elders-quorum-c8","title":"service coordinator","personId":null},{"id":"elders-quorum-c9","title":"activities coordinator","personId":"chris-foulger"},{"id":"elders-quorum-c10","title":"welcome committee leader","personId":null},{"id":"elders-quorum-c11","title":"technology specialist","personId":null},{"id":"elders-quorum-c12","title":"ward mission leader","personId":"doug-roberts"},{"id":"elders-quorum-c13","title":"ward missionary","personId":null},{"id":"elders-quorum-c14","title":"temple & family history","personId":null},{"id":"elders-quorum-c15","title":"Full Time Missionary","personId":null},{"id":"elders-quorum-c16","title":"Full Time Missionary","personId":null}]},{"id":"relief-society","name":"RELIEF SOCIETY","callings":[{"id":"relief-society-c1","title":"president","personId":"debbie-stransky"},{"id":"relief-society-c2","title":"first counselor - Mission","personId":"shawn-mcguire"},{"id":"relief-society-c3","title":"second counselor - Temple","personId":"julia-barker"},{"id":"relief-society-c4","title":"secretary","personId":"kelly-wright"},{"id":"relief-society-c5","title":"assistant secretary","personId":null},{"id":"relief-society-c6","title":"ministering secretary","personId":"emily-roberts"},{"id":"relief-society-c7","title":"temple & family history","personId":null},{"id":"relief-society-c8","title":"instructor","personId":"brittany-perdue"},{"id":"relief-society-c9","title":"instructor","personId":"brenna-nuckols"},{"id":"relief-society-c10","title":"activity coordinator","personId":"wendy-clark"},{"id":"relief-society-c11","title":"assistant activity coordinator","personId":null},{"id":"relief-society-c12","title":"activity committe member","personId":"emily-roberts"},{"id":"relief-society-c13","title":"activity committe member","personId":"heather-mcmullin"},{"id":"relief-society-c14","title":"activity committe member","personId":"blythe-bowen"},{"id":"relief-society-c15","title":"activity committe member","personId":"crystal-knoblauch"},{"id":"relief-society-c16","title":"activity committe member","personId":"tiffany-sauter"},{"id":"relief-society-c17","title":"activity committe member","personId":"jessica-gove"},{"id":"relief-society-c18","title":"activity committe member","personId":"cristen-miller"},{"id":"relief-society-c19","title":"activity committe member","personId":null},{"id":"relief-society-c20","title":"service coordinator","personId":"sarah-willie"},{"id":"relief-society-c21","title":"assistant service coordinator","personId":"porama-micare"}]},{"id":"deacons-quorum","name":"DEACONS QUORUM","callings":[{"id":"deacons-quorum-c1","title":"President","personId":"oliver-moore"},{"id":"deacons-quorum-c2","title":"First counselor","personId":"jonah-stevenson"},{"id":"deacons-quorum-c3","title":"Second counselor","personId":"colin-mcguire"},{"id":"deacons-quorum-c4","title":"Secretary","personId":"ford-mathis"},{"id":"deacons-quorum-c5","title":"Advisor","personId":"tristan-perdue"},{"id":"deacons-quorum-c6","title":"Advisor","personId":"sam-baxter"},{"id":"deacons-quorum-c7","title":"Advisor","personId":"joel-cornwell"}]},{"id":"young-women-11-12","name":"YOUNG WOMEN 11-12","callings":[{"id":"young-women-11-12-c1","title":"President","personId":"yaretzi-cantero-blanco"},{"id":"young-women-11-12-c2","title":"First counselor","personId":"alexandra-thompson"},{"id":"young-women-11-12-c3","title":"Second counselor","personId":"adelaide-claire-huggins"},{"id":"young-women-11-12-c4","title":"Secretary","personId":"aliya-nicolle-garns"}]},{"id":"primary","name":"Primary","callings":[{"id":"primary-c1","title":"President","personId":"tifany-smith"},{"id":"primary-c2","title":"First counselor","personId":"morgan-stevenson"},{"id":"primary-c3","title":"Second Counselor","personId":"mckenzie-hyde"},{"id":"primary-c4","title":"Secretary","personId":"julie-null"},{"id":"primary-c5","title":"Music","personId":"joy-robles"},{"id":"primary-c6","title":"Piano","personId":"jordan-kamalu"},{"id":"primary-c7","title":"Nursery Leader","personId":"janae-layton"},{"id":"primary-c8","title":"Nursery","personId":"kristina-vasilev"},{"id":"primary-c9","title":"Nursery","personId":null},{"id":"primary-c10","title":"Sunbeams/CTR 4","personId":"kayla-cline"},{"id":"primary-c11","title":"Sunbeams/CTR 4","personId":"ella-mchenry"},{"id":"primary-c12","title":"CTR 5/ CTR 6","personId":"james-thompson"},{"id":"primary-c13","title":"CTR 5/ CTR 6","personId":"philip-hurst"},{"id":"primary-c14","title":"CTR 7A","personId":"tyler-garns"},{"id":"primary-c15","title":"CTR 7A","personId":"rob-stransky"},{"id":"primary-c16","title":"CTR 7B","personId":"issac-moore"},{"id":"primary-c17","title":"CTR 7B","personId":"griffin-vu"},{"id":"primary-c18","title":"Valiant 8","personId":"karen-percy"},{"id":"primary-c19","title":"Valiant 8","personId":"howard-percy"},{"id":"primary-c20","title":"Valiant 9","personId":"hollee-osborne"},{"id":"primary-c21","title":"Valiant 9","personId":"jen-vu"},{"id":"primary-c22","title":"Valiant 10","personId":"tina-dickson"},{"id":"primary-c23","title":"Valiant 10","personId":"shanda-bunker"},{"id":"primary-c24","title":"Activity Days Leader","personId":"steven-nuckols"},{"id":"primary-c25","title":"Activity Days Leader","personId":"andrew-null"},{"id":"primary-c26","title":"Activity Days Leader","personId":"brenna-nuckols"},{"id":"primary-c27","title":"Activity Days Leader","personId":"brittany-perdue"},{"id":"primary-c28","title":"Activity Days Leader","personId":"lindsey-carrico"},{"id":"primary-c29","title":"Activity Days Leader","personId":"crystal-knoblauch"},{"id":"primary-c30","title":"Activity Days Leader","personId":"elizabeth-hurst"}]},{"id":"building-maintenance","name":"Building/Maintenance","callings":[{"id":"building-maintenance-c1","title":"Ward Building Specialist","personId":"robert-sheffield"},{"id":"building-maintenance-c2","title":"Ward Building Specialist","personId":"eric-mortinsen"}]},{"id":"ward-activities","name":"Ward Activities","callings":[{"id":"ward-activities-c1","title":"Ward Activity Leader","personId":"alisha-terhufen"},{"id":"ward-activities-c2","title":"Ward Activities","personId":"yanita-heisel"},{"id":"ward-activities-c3","title":"Ward Activities","personId":null},{"id":"ward-activities-c4","title":"Ward Activiites","personId":null}]},{"id":"stake-callings","name":"Stake Callings","callings":[{"id":"stake-callings-c1","title":"Stake Primary President","personId":"jill-garns"},{"id":"stake-callings-c2","title":"Stake High Council","personId":"nate-morley"},{"id":"stake-callings-c3","title":"Stake High Council","personId":"travis-campbell"},{"id":"stake-callings-c4","title":"Seminary Instructor","personId":"chris-carr"},{"id":"stake-callings-c5","title":"Seminary Instructor","personId":"nate-wright"},{"id":"stake-callings-c6","title":"Seminary President","personId":null},{"id":"stake-callings-c7","title":"Area Authority","personId":"david-clark"},{"id":"stake-callings-c8","title":"Stake Communication Specialist","personId":"shanda-bunker"},{"id":"stake-callings-c9","title":"Stake YW Counselor","personId":"kayley-hoggan"},{"id":"stake-callings-c10","title":"Stake RS Secretary","personId":"kristi-mickelsen"},{"id":"stake-callings-c11","title":"Stake Executive Secretary","personId":"kevin-mcguire"},{"id":"stake-callings-c12","title":"Stake Clerk","personId":"craig-bruschke"},{"id":"stake-callings-c13","title":"Stake Primary Presidency","personId":"megan-sayer"},{"id":"stake-callings-c14","title":"Stake YM Presidency","personId":"carter-hoggan"},{"id":"stake-callings-c15","title":"Stake Trek Leader","personId":"sam-baxter"},{"id":"stake-callings-c16","title":"Stake Trek Leader","personId":"lisa-baxter"}]}],"people":[{"id":"adelaide-claire-huggins","name":"Adelaide Claire Huggins"},{"id":"aleksander-vasilev","name":"Aleksander Vasilev"},{"id":"alexandra-thompson","name":"Alexandra Thompson"},{"id":"alisha-terhufen","name":"Alisha Terhufen"},{"id":"aliya-nicolle-garns","name":"Aliya Nicolle Garns"},{"id":"andrew-null","name":"Andrew Null"},{"id":"anessa-gamez","name":"Anessa Gamez"},{"id":"austin-campbell","name":"Austin Campbell"},{"id":"austin-hyde","name":"Austin Hyde"},{"id":"ben-barker","name":"Ben Barker"},{"id":"ben-bowen","name":"Ben Bowen"},{"id":"benjamin-robles","name":"Benjamin Robles"},{"id":"blythe-bowen","name":"Blythe Bowen"},{"id":"brenna-nuckols","name":"Brenna Nuckols"},{"id":"brittany-perdue","name":"Brittany Perdue"},{"id":"brooke-brown","name":"Brooke Brown"},{"id":"brooklynn-stinson","name":"Brooklynn stinson"},{"id":"cameron-stinson","name":"Cameron Stinson"},{"id":"cami-bruschke","name":"Cami Bruschke"},{"id":"cami-nelson","name":"Cami Nelson"},{"id":"carter-hoggan","name":"Carter Hoggan"},{"id":"celine-stinson","name":"Celine Stinson"},{"id":"chris-carr","name":"Chris Carr"},{"id":"chris-foulger","name":"Chris Foulger"},{"id":"colin-mcguire","name":"Colin McGuire"},{"id":"craig-bruschke","name":"Craig Bruschke"},{"id":"cristen-miller","name":"Cristen Miller"},{"id":"crystal-facuri","name":"Crystal Facuri"},{"id":"crystal-knoblauch","name":"Crystal Knoblauch"},{"id":"curtis-layton","name":"Curtis Layton"},{"id":"danica-nelson","name":"Danica Nelson"},{"id":"david-clark","name":"David Clark"},{"id":"debbie-stransky","name":"Debbie Stransky"},{"id":"doug-roberts","name":"Doug Roberts"},{"id":"ed-cheng","name":"Ed Cheng"},{"id":"elizabeth-hurst","name":"Elizabeth Hurst"},{"id":"ella-mchenry","name":"Ella McHenry"},{"id":"emily-roberts","name":"Emily Roberts"},{"id":"eric-mortinsen","name":"Eric Mortinsen"},{"id":"erick-sayer","name":"Erick Sayer"},{"id":"erin-carr","name":"Erin Carr"},{"id":"erin-shields","name":"Erin Shields"},{"id":"ethan-mcguire","name":"Ethan McGuire"},{"id":"ford-mathis","name":"Ford Mathis"},{"id":"gloria-bowen","name":"Gloria Bowen"},{"id":"greg-taylor","name":"Greg Taylor"},{"id":"grey-barker","name":"Grey Barker"},{"id":"griffin-vu","name":"Griffin Vu"},{"id":"heather-mcmullin","name":"Heather Mcmullin"},{"id":"hollee-osborne","name":"Hollee Osborne"},{"id":"howard-percy","name":"Howard Percy"},{"id":"ian-huggins","name":"Ian Huggins"},{"id":"issac-moore","name":"Issac Moore"},{"id":"jake-moore","name":"Jake Moore"},{"id":"james-humberstone","name":"James Humberstone"},{"id":"james-thompson","name":"James Thompson"},{"id":"janae-layton","name":"Janae Layton"},{"id":"jen-vu","name":"Jen Vu"},{"id":"jessica-gove","name":"Jessica Gove"},{"id":"jill-garns","name":"Jill Garns"},{"id":"jim-gamez","name":"Jim Gamez"},{"id":"jody-moore","name":"Jody Moore"},{"id":"joel-cornwell","name":"Joel Cornwell"},{"id":"jonah-stevenson","name":"Jonah Stevenson"},{"id":"jonathan-gove","name":"Jonathan Gove"},{"id":"jonathon-mickelsen","name":"Jonathon Mickelsen"},{"id":"jordan-kamalu","name":"Jordan Kamalu"},{"id":"joslyn-reed-berry","name":"Joslyn Reed (Berry)"},{"id":"joy-robles","name":"Joy Robles"},{"id":"julia-barker","name":"Julia Barker"},{"id":"julie-null","name":"Julie Null"},{"id":"kaden-willie","name":"Kaden Willie"},{"id":"karen-percy","name":"Karen Percy"},{"id":"kayla-cline","name":"Kayla Cline"},{"id":"kayley-hoggan","name":"Kayley Hoggan"},{"id":"kelly-wright","name":"Kelly Wright"},{"id":"kevin-mcguire","name":"Kevin McGuire"},{"id":"krisina-vasilev","name":"Krisina Vasilev"},{"id":"kristi-mickelsen","name":"Kristi Mickelsen"},{"id":"kristina-vasilev","name":"Kristina Vasilev"},{"id":"kyle-shields","name":"Kyle Shields"},{"id":"landon-cline","name":"Landon Cline"},{"id":"lindsey-carrico","name":"Lindsey Carrico"},{"id":"lisa-baxter","name":"Lisa Baxter"},{"id":"liv-morley","name":"Liv Morley"},{"id":"livi-baxter","name":"Livi Baxter"},{"id":"lucas-campbell","name":"Lucas Campbell"},{"id":"martin-salgado","name":"Martin Salgado"},{"id":"mason-carr","name":"Mason Carr"},{"id":"matt-brown","name":"Matt Brown"},{"id":"matt-stevenson","name":"Matt Stevenson"},{"id":"mayra-thompson","name":"Mayra Thompson"},{"id":"mckenzie-hyde","name":"McKenzie Hyde"},{"id":"megan-sayer","name":"Megan Sayer"},{"id":"micah-mathis","name":"Micah Mathis"},{"id":"mike-florence","name":"Mike Florence"},{"id":"mike-heisel","name":"Mike Heisel"},{"id":"morgan-stevenson","name":"Morgan Stevenson"},{"id":"nate-facuri","name":"Nate Facuri"},{"id":"nate-morley","name":"Nate Morley"},{"id":"nate-wright","name":"Nate Wright"},{"id":"oliver-moore","name":"Oliver Moore"},{"id":"owen-harris","name":"Owen Harris"},{"id":"parker-smith","name":"Parker Smith"},{"id":"pearl-smith","name":"Pearl Smith"},{"id":"peter-walker","name":"Peter Walker"},{"id":"philip-hurst","name":"Philip Hurst"},{"id":"porama-micare","name":"Porama Micare"},{"id":"quinton-smith","name":"Quinton Smith"},{"id":"rob-stransky","name":"Rob Stransky"},{"id":"robert-sheffield","name":"Robert Sheffield"},{"id":"ruby-wrigt","name":"Ruby Wrigt"},{"id":"ryan-bunker","name":"Ryan Bunker"},{"id":"ryan-smith","name":"Ryan Smith"},{"id":"sam-baxter","name":"Sam Baxter"},{"id":"sara-huggins","name":"Sara Huggins"},{"id":"sara-morley","name":"Sara Morley"},{"id":"sarah-willie","name":"Sarah Willie"},{"id":"saylor-brown","name":"Saylor Brown"},{"id":"seth-brazier","name":"Seth Brazier"},{"id":"shanda-bunker","name":"Shanda Bunker"},{"id":"shawn-mcguire","name":"Shawn McGuire"},{"id":"shayne-brazier","name":"Shayne Brazier"},{"id":"stephanie-cheng","name":"Stephanie Cheng"},{"id":"steven-nuckols","name":"Steven Nuckols"},{"id":"tami-foulger","name":"Tami Foulger"},{"id":"tarah-campbell","name":"Tarah Campbell"},{"id":"tea-henderson","name":"Tea Henderson"},{"id":"tifany-smith","name":"Tifany Smith"},{"id":"tiffany-sauter","name":"Tiffany Sauter"},{"id":"tina-dickson","name":"Tina Dickson"},{"id":"tracy-mathis","name":"Tracy Mathis"},{"id":"travis-campbell","name":"Travis Campbell"},{"id":"tristan-perdue","name":"Tristan Perdue"},{"id":"tucker-terhufen","name":"Tucker Terhufen"},{"id":"tyler-garns","name":"Tyler Garns"},{"id":"vanessa-salgado","name":"Vanessa Salgado"},{"id":"veranice-berry","name":"Veranice Berry"},{"id":"vicki-bradford","name":"Vicki Bradford"},{"id":"wendy-clark","name":"Wendy Clark"},{"id":"yanita-heisel","name":"Yanita Heisel"},{"id":"yaretzi-cantero-blanco","name":"Yaretzi Cantero Blanco"},{"id":"zach-nelson","name":"Zach Nelson"}],"unassigned":["martin-salgado","jonathon-mickelsen","gloria-bowen","veranice-berry","vanessa-salgado","peter-walker","micah-mathis","quinton-smith","ben-bowen","krisina-vasilev","crystal-facuri","tea-henderson","greg-taylor"]};

// ----- helpers -----

function titleCase(str) {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map(w => {
      if (/^\d/.test(w)) return w;
      if (w.length <= 2 && /^[a-z]+$/.test(w)) return w.charAt(0).toUpperCase() + w.slice(1);
      if (w.includes('/')) {
        return w.split('/').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('/');
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] || '') : '';
  return (first + last).toUpperCase();
}

// color-seeded avatar from name
function avatarBg(name) {
  const palette = [
    '#D4C5A2', '#C9B99F', '#B5A58B', '#A89C8E',
    '#8FA58E', '#9BAE94', '#B5B098', '#C4B79E',
    '#D8B59A', '#C9A58E', '#B8967F', '#A68270'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

async function storageGet(key) {
  try {
    const r = await window.storage.get(key);
    if (!r) return null;
    return JSON.parse(r.value);
  } catch { return null; }
}

async function storageSet(key, value) {
  try { await window.storage.set(key, JSON.stringify(value)); }
  catch (e) { console.error('storage.set failed', key, e); }
}

async function storageDelete(key) {
  try { await window.storage.delete(key); } catch {}
}

function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function snapshotFromMaster(master, people) {
  // Deep clone organizations; add called/sustained fields to every calling for draft use.
  // setApart is NOT tracked inside drafts — it's recomputed on promotion.
  const orgs = master.organizations.map(o => ({
    id: o.id,
    name: o.name,
    callings: o.callings.map(c => ({
      id: c.id,
      title: c.title,
      personId: c.personId,
      called: false,
      sustained: false,
    })),
  }));
  return {
    organizations: orgs,
    unassigned: [...master.unassigned],
    staging: [],
    people: people, // shared reference, people dict is immutable
  };
}

// migration: ensure master callings have setApart field
function ensureMasterFields(m) {
  if (!m) return m;
  const next = {
    ...m,
    organizations: m.organizations.map(o => ({
      ...o,
      callings: o.callings.map(c => ({
        ...c,
        setApart: typeof c.setApart === 'boolean' ? c.setApart : false,
      })),
    })),
  };
  return next;
}

// migration: ensure draft callings have called/sustained fields
function ensureDraftFields(d) {
  if (!d) return d;
  return {
    ...d,
    staging: d.staging || [],
    unassigned: d.unassigned || [],
    organizations: d.organizations.map(o => ({
      ...o,
      callings: o.callings.map(c => ({
        ...c,
        called: typeof c.called === 'boolean' ? c.called : false,
        sustained: typeof c.sustained === 'boolean' ? c.sustained : false,
        // strip any stale setApart from drafts (it's a master-only concern)
      })),
    })),
  };
}

// ----- styling tokens -----
const T = {
  bg: '#F5EFE1',            // warm parchment
  bgSoft: '#FAF6EC',
  surface: '#FFFFFF',
  ink: '#1C1917',
  inkMuted: '#78716C',
  inkFaint: '#A8A29E',
  border: '#E7E2D5',
  borderStrong: '#D6D0BF',
  sage: '#4A6B42',          // master accent
  sageSoft: '#E8EFE4',
  amber: '#A0501A',         // draft accent
  amberSoft: '#F5E7D4',
  stagingBg: '#FEF3C7',
  stagingBorder: '#FDE68A',
  unassignedBg: '#F1ECDE',
  unassignedBorder: '#D9D3BE',
};

const FONTS = {
  display: '"Fraunces", "Libre Caslon Text", Georgia, serif',
  body: '"DM Sans", "Helvetica Neue", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

// ----- Yes/No toggle (radio-style) -----

function YesNoToggle({ label, value, onChange, accent }) {
  const yesBg = value === true ? (accent || T.sage) : 'transparent';
  const noBg = value === false ? T.inkMuted : 'transparent';
  return (
    <div className="inline-flex items-center gap-1.5" style={{ flexShrink: 0 }}>
      <span
        style={{
          fontSize: 9,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: T.inkMuted,
          fontFamily: FONTS.body,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <div
        className="inline-flex"
        style={{
          borderRadius: 999,
          overflow: 'hidden',
          border: `1px solid ${T.border}`,
          backgroundColor: T.surface,
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(true); }}
          style={{
            fontSize: 10,
            padding: '1px 7px',
            lineHeight: 1.4,
            fontFamily: FONTS.body,
            fontWeight: value === true ? 700 : 500,
            backgroundColor: yesBg,
            color: value === true ? '#FFFFFF' : T.inkMuted,
            cursor: 'pointer',
            transition: 'all 120ms',
            border: 'none',
          }}
        >
          Y
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(false); }}
          style={{
            fontSize: 10,
            padding: '1px 7px',
            lineHeight: 1.4,
            fontFamily: FONTS.body,
            fontWeight: value === false ? 700 : 500,
            backgroundColor: noBg,
            color: value === false ? '#FFFFFF' : T.inkMuted,
            cursor: 'pointer',
            transition: 'all 120ms',
            border: 'none',
            borderLeft: `1px solid ${T.border}`,
          }}
        >
          N
        </button>
      </div>
    </div>
  );
}

// ----- person chip -----

function PersonChip({ personId, peopleById, source, isMaster, pickedUp, onPickup, onDragStart, compact }) {
  const person = peopleById[personId];
  if (!person) return null;
  const isPicked = !!(pickedUp && pickedUp.personId === personId &&
    pickedUp.source.type === source.type &&
    pickedUp.source.orgId === source.orgId &&
    pickedUp.source.callingId === source.callingId);

  function handleDragStart(e) {
    if (isMaster) { e.preventDefault(); return; }
    const payload = { personId, source };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart && onDragStart(payload);
  }

  function handleClick(e) {
    if (isMaster) return;
    onPickup(personId, source);
  }

  return (
    <div
      draggable={!isMaster}
      onDragStart={handleDragStart}
      onClick={handleClick}
      className={`group inline-flex items-center gap-2 rounded-full transition-all select-none ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'} ${isMaster ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
      style={{
        backgroundColor: isPicked ? T.amberSoft : T.surface,
        border: `1px solid ${isPicked ? T.amber : T.border}`,
        boxShadow: isPicked ? `0 0 0 3px ${T.amberSoft}, 0 4px 12px rgba(160,80,26,0.15)` : '0 1px 2px rgba(28,25,23,0.04)',
        fontFamily: FONTS.body,
      }}
      title={isMaster ? person.name : 'Drag or tap to move'}
    >
      <div
        className={`flex-none rounded-full flex items-center justify-center font-semibold ${compact ? 'w-5 h-5' : 'w-6 h-6'}`}
        style={{ backgroundColor: avatarBg(person.name), color: '#FFFFFF', fontFamily: FONTS.body, letterSpacing: '0.02em', fontSize: 10 }}
      >
        {initials(person.name)}
      </div>
      <span style={{ color: T.ink, fontSize: compact ? 12 : 13, fontWeight: 500, letterSpacing: '-0.005em' }}>
        {person.name}
      </span>
    </div>
  );
}

// ----- drop zone wrapper -----

function DropZone({ isMaster, onDrop, children, className = '', style = {}, active, onClick, dragHover, setDragHover, zoneKey }) {
  function handleDragOver(e) {
    if (isMaster) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (setDragHover && dragHover !== zoneKey) setDragHover(zoneKey);
  }
  function handleDragLeave(e) {
    if (setDragHover) setDragHover(null);
  }
  function handleDrop(e) {
    if (isMaster) return;
    e.preventDefault();
    if (setDragHover) setDragHover(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      onDrop(data);
    } catch {}
  }
  const isHover = dragHover === zoneKey;
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onClick}
      className={className}
      style={{
        ...style,
        outline: isHover ? `2px dashed ${T.amber}` : 'none',
        outlineOffset: isHover ? 2 : 0,
        transition: 'outline 120ms ease',
      }}
    >
      {children}
    </div>
  );
}

// ----- calling slot -----

function CallingSlot({ org, calling, peopleById, isMaster, pickedUp, onPickup, onMove, onToggleSetApart, onToggleCalled, onToggleSustained, dragHover, setDragHover }) {
  const source = { type: 'calling', orgId: org.id, callingId: calling.id };
  const zoneKey = `calling:${calling.id}`;

  function handleDrop(data) {
    if (data.personId) onMove(data, { type: 'calling', orgId: org.id, callingId: calling.id });
  }

  function handleSlotClick() {
    if (isMaster) return;
    if (pickedUp) {
      onMove({ personId: pickedUp.personId, source: pickedUp.source }, { type: 'calling', orgId: org.id, callingId: calling.id });
    }
  }

  const titleDisplay = calling.title.replace(/\s+/g, ' ').trim();

  return (
    <DropZone
      isMaster={isMaster}
      onDrop={handleDrop}
      onClick={handleSlotClick}
      dragHover={dragHover}
      setDragHover={setDragHover}
      zoneKey={zoneKey}
      className="py-2 px-0 first:pt-0 last:pb-0"
      style={{ borderBottom: `1px solid ${T.border}` }}
    >
      <div
        className=" uppercase mb-1.5"
        style={{ color: T.inkMuted, fontFamily: FONTS.body, fontWeight: 500, fontSize: 10, letterSpacing: '0.12em' }}
      >
        {titleDisplay}
      </div>
      {calling.personId ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <PersonChip
            personId={calling.personId}
            peopleById={peopleById}
            source={source}
            isMaster={isMaster}
            pickedUp={pickedUp}
            onPickup={onPickup}
          />
          {isMaster ? (
            <YesNoToggle
              label="Set Apart"
              value={!!calling.setApart}
              onChange={(v) => onToggleSetApart && onToggleSetApart(org.id, calling.id, v)}
              accent={T.sage}
            />
          ) : (
            <>
              <YesNoToggle
                label="Called"
                value={!!calling.called}
                onChange={(v) => onToggleCalled && onToggleCalled(org.id, calling.id, v)}
                accent={T.amber}
              />
              <YesNoToggle
                label="Sustained"
                value={!!calling.sustained}
                onChange={(v) => onToggleSustained && onToggleSustained(org.id, calling.id, v)}
                accent={T.amber}
              />
            </>
          )}
        </div>
      ) : (
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 italic"
          style={{
            color: T.inkFaint,
            border: `1px dashed ${T.borderStrong}`,
            backgroundColor: 'transparent',
            fontFamily: FONTS.body,
            fontSize: 12,
          }}
        >
          {pickedUp && !isMaster ? 'Tap to place here' : 'Unfilled'}
        </div>
      )}
    </DropZone>
  );
}

// ----- org card -----

function OrgCard({ org, peopleById, isMaster, pickedUp, onPickup, onMove, onToggleSetApart, onToggleCalled, onToggleSustained, searchQuery, dragHover, setDragHover }) {
  const filled = org.callings.filter(c => c.personId).length;
  const total = org.callings.length;

  // filter by search
  const filteredCallings = useMemo(() => {
    if (!searchQuery) return org.callings;
    const q = searchQuery.toLowerCase();
    return org.callings.filter(c => {
      const p = c.personId ? peopleById[c.personId] : null;
      return (p && p.name.toLowerCase().includes(q)) ||
             c.title.toLowerCase().includes(q) ||
             org.name.toLowerCase().includes(q);
    });
  }, [org, peopleById, searchQuery]);

  if (searchQuery && filteredCallings.length === 0) return null;

  return (
    <div
      className="flex flex-col rounded-lg overflow-hidden"
      style={{
        backgroundColor: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: '0 1px 3px rgba(28,25,23,0.04), 0 4px 16px rgba(28,25,23,0.03)',
      }}
    >
      <div
        className="flex items-baseline justify-between px-5 pt-4 pb-3"
        style={{ borderBottom: `1px solid ${T.border}` }}
      >
        <h3
          className=" leading-tight"
          style={{ color: T.ink, fontFamily: FONTS.display, fontWeight: 500, letterSpacing: '-0.01em', fontSize: 19 }}
        >
          {titleCase(org.name)}
        </h3>
        <div className="flex items-baseline gap-1.5">
          <span style={{ fontFamily: FONTS.mono, color: T.ink, fontSize: 13, fontWeight: 500 }}>
            {filled}
          </span>
          <span style={{ fontFamily: FONTS.mono, color: T.inkFaint, fontSize: 11 }}>
            / {total}
          </span>
        </div>
      </div>
      <div className="px-5 py-2">
        {filteredCallings.map(c => (
          <CallingSlot
            key={c.id}
            org={org}
            calling={c}
            peopleById={peopleById}
            isMaster={isMaster}
            pickedUp={pickedUp}
            onPickup={onPickup}
            onMove={onMove}
            onToggleSetApart={onToggleSetApart}
            onToggleCalled={onToggleCalled}
            onToggleSustained={onToggleSustained}
            dragHover={dragHover}
            setDragHover={setDragHover}
          />
        ))}
      </div>
    </div>
  );
}

// ----- rail (staging or unassigned) -----

function Rail({ title, icon: Icon, people, peopleById, sourceType, isMaster, pickedUp, onPickup, onMove, bg, borderColor, helpText, dragHover, setDragHover, onAdd }) {
  const zoneKey = `rail:${sourceType}`;

  function handleDrop(data) {
    onMove(data, { type: sourceType });
  }

  function handleClick() {
    if (isMaster) return;
    if (pickedUp) onMove({ personId: pickedUp.personId, source: pickedUp.source }, { type: sourceType });
  }

  return (
    <DropZone
      isMaster={isMaster}
      onDrop={handleDrop}
      onClick={handleClick}
      dragHover={dragHover}
      setDragHover={setDragHover}
      zoneKey={zoneKey}
      className="rounded-lg p-4"
      style={{
        backgroundColor: bg,
        border: `1px solid ${borderColor}`,
        minHeight: 96,
      }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={15} style={{ color: T.ink }} strokeWidth={1.75} />
          <h4
            className=""
            style={{ color: T.ink, fontFamily: FONTS.display, fontWeight: 500, letterSpacing: '-0.005em', fontSize: 15 }}
          >
            {title}
          </h4>
          <span
            className=" px-1.5 rounded-full"
            style={{
              fontFamily: FONTS.mono,
              backgroundColor: T.surface,
              color: T.inkMuted,
              border: `1px solid ${T.border}`,
              fontSize: 11,
            }}
          >
            {people.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {helpText && (
            <span className="" style={{ color: T.inkMuted, fontFamily: FONTS.body, fontSize: 10 }}>
              {helpText}
            </span>
          )}
          {onAdd && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
              className="inline-flex items-center gap-1 rounded-full"
              style={{
                fontFamily: FONTS.body,
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 9px 3px 7px',
                backgroundColor: T.surface,
                border: `1px solid ${T.borderStrong}`,
                color: T.ink,
                cursor: 'pointer',
                letterSpacing: '0.01em',
              }}
              title="Add a new member to the ward"
            >
              <Plus size={11} strokeWidth={2.25} />
              Add member
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {people.length === 0 ? (
          <div
            className=" italic py-2 px-1"
            style={{ color: T.inkFaint, fontFamily: FONTS.body, fontSize: 12 }}
          >
            {sourceType === 'staging' ? 'Empty — nobody displaced yet.' : 'All members have callings.'}
          </div>
        ) : (
          people.map(pid => (
            <PersonChip
              key={pid + ':' + sourceType}
              personId={pid}
              peopleById={peopleById}
              source={{ type: sourceType }}
              isMaster={isMaster}
              pickedUp={pickedUp}
              onPickup={onPickup}
              compact
            />
          ))
        )}
      </div>
    </DropZone>
  );
}

// ----- changes list (draft only) -----

function ChangesList({ master, draft, peopleById }) {
  const changes = useMemo(() => {
    if (!master || !draft) return [];
    // Build assignment maps keyed by personId
    function buildAssignments(orgs) {
      const byPerson = new Map();
      for (const o of orgs) {
        for (const c of o.callings) {
          if (c.personId) {
            if (!byPerson.has(c.personId)) byPerson.set(c.personId, []);
            byPerson.get(c.personId).push({
              callingId: c.id,
              orgName: o.name,
              callingTitle: c.title,
              called: !!c.called,
              sustained: !!c.sustained,
            });
          }
        }
      }
      return byPerson;
    }
    const masterMap = buildAssignments(master.organizations);
    const draftMap = buildAssignments(draft.organizations);
    const staged = new Set(draft.staging || []);
    const masterUnassigned = new Set(master.unassigned || []);
    const draftUnassigned = new Set(draft.unassigned || []);

    const allIds = new Set([
      ...masterMap.keys(),
      ...draftMap.keys(),
      ...staged,
      ...masterUnassigned,
      ...draftUnassigned,
    ]);

    const result = [];
    for (const personId of allIds) {
      const from = masterMap.get(personId) || [];
      const to = draftMap.get(personId) || [];
      const wasUnassigned = masterUnassigned.has(personId);
      const isUnassigned = draftUnassigned.has(personId);
      const isStaged = staged.has(personId);

      const fromIds = from.map(x => x.callingId).sort().join(',');
      const toIds = to.map(x => x.callingId).sort().join(',');

      const sameAssignments = fromIds === toIds;
      const stateChanged =
        wasUnassigned !== isUnassigned ||
        isStaged; // staging is a transient state that's a change by definition

      if (sameAssignments && !stateChanged) continue;

      result.push({
        personId,
        from,
        to,
        wasUnassigned,
        isUnassigned,
        isStaged,
      });
    }
    // stable sort by person name
    result.sort((a, b) => {
      const an = (peopleById[a.personId]?.name || '').toLowerCase();
      const bn = (peopleById[b.personId]?.name || '').toLowerCase();
      return an < bn ? -1 : an > bn ? 1 : 0;
    });
    return result;
  }, [master, draft, peopleById]);

  return (
    <div
      className="rounded-lg"
      style={{
        backgroundColor: T.surface,
        border: `1px solid ${T.border}`,
        overflow: 'hidden',
      }}
    >
      <div
        className="px-5 py-3 flex items-baseline justify-between"
        style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: T.bgSoft }}
      >
        <div className="flex items-baseline gap-3">
          <h3
            style={{
              color: T.ink,
              fontFamily: FONTS.display,
              fontWeight: 500,
              fontSize: 18,
              letterSpacing: '-0.01em',
            }}
          >
            Changes from Master
          </h3>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 12,
              color: T.inkMuted,
            }}
          >
            {changes.length} {changes.length === 1 ? 'person' : 'people'}
          </span>
        </div>
        <span
          style={{
            fontFamily: FONTS.body,
            fontSize: 11,
            color: T.inkFaint,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {draft?.name}
        </span>
      </div>

      {changes.length === 0 ? (
        <div
          className="px-5 py-6 text-center italic"
          style={{ color: T.inkFaint, fontFamily: FONTS.body, fontSize: 13 }}
        >
          No changes yet. Drag people to callings to see the diff here.
        </div>
      ) : (
        <div>
          {changes.map((ch, idx) => {
            const person = peopleById[ch.personId];
            if (!person) return null;
            return (
              <div
                key={ch.personId}
                className="px-5 py-3"
                style={{
                  borderBottom: idx < changes.length - 1 ? `1px solid ${T.border}` : 'none',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex-none rounded-full flex items-center justify-center font-semibold"
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: avatarBg(person.name),
                      color: '#FFFFFF',
                      fontFamily: FONTS.body,
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    {initials(person.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      style={{
                        fontFamily: FONTS.body,
                        fontWeight: 600,
                        fontSize: 14,
                        color: T.ink,
                        letterSpacing: '-0.005em',
                      }}
                    >
                      {person.name}
                    </div>
                    <div
                      className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1"
                      style={{ fontFamily: FONTS.body, fontSize: 12 }}
                    >
                      {/* FROM */}
                      <span style={{ color: T.inkMuted, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }}>
                        Was
                      </span>
                      <span style={{ color: T.ink }}>
                        {ch.from.length === 0
                          ? <em style={{ color: T.inkFaint, fontStyle: 'italic' }}>{ch.wasUnassigned ? 'unassigned' : 'no prior calling'}</em>
                          : ch.from.map((a, i) => (
                              <span key={a.callingId}>
                                {i > 0 && <span style={{ color: T.inkFaint }}>, </span>}
                                <span>{titleCase(a.orgName)}</span>
                                <span style={{ color: T.inkMuted }}> · </span>
                                <span>{a.callingTitle}</span>
                              </span>
                            ))
                        }
                      </span>
                    </div>
                    <div
                      className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-1"
                      style={{ fontFamily: FONTS.body, fontSize: 12 }}
                    >
                      {/* TO */}
                      <span style={{ color: T.amber, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }}>
                        Now
                      </span>
                      <span style={{ color: T.ink }}>
                        {ch.isStaged ? (
                          <span style={{ color: T.amber, fontWeight: 600 }}>
                            {ch.to.length > 0 ? `${ch.to.map(a => `${titleCase(a.orgName)} · ${a.callingTitle}`).join(', ')} + ` : ''}
                            in Staging
                          </span>
                        ) : ch.to.length === 0 ? (
                          <em style={{ color: T.inkFaint, fontStyle: 'italic' }}>
                            {ch.isUnassigned ? 'unassigned' : 'no calling'}
                          </em>
                        ) : (
                          ch.to.map((a, i) => (
                            <span key={a.callingId}>
                              {i > 0 && <span style={{ color: T.inkFaint }}>, </span>}
                              <span style={{ fontWeight: 500 }}>{titleCase(a.orgName)}</span>
                              <span style={{ color: T.inkMuted }}> · </span>
                              <span>{a.callingTitle}</span>
                            </span>
                          ))
                        )}
                      </span>
                    </div>
                    {/* called/sustained status if they have any new/changed assignments */}
                    {ch.to.length > 0 && (
                      <div
                        className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1"
                        style={{ fontFamily: FONTS.body, fontSize: 11 }}
                      >
                        {ch.to.map(a => {
                          // Only show status for NEW assignments (not present in master with same person)
                          const wasSame = ch.from.some(f => f.callingId === a.callingId);
                          if (wasSame) return null;
                          return (
                            <div key={a.callingId} className="inline-flex items-center gap-2">
                              <span style={{ color: T.inkFaint, fontStyle: 'italic' }}>
                                {a.callingTitle}:
                              </span>
                              <span style={{ color: a.called ? T.amber : T.inkMuted, fontWeight: a.called ? 600 : 500 }}>
                                {a.called ? '✓' : '○'} Called
                              </span>
                              <span style={{ color: a.sustained ? T.amber : T.inkMuted, fontWeight: a.sustained ? 600 : 500 }}>
                                {a.sustained ? '✓' : '○'} Sustained
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ----- header -----

function Header({ viewId, master, drafts, onSelect, onNewDraft, onPromote, onDelete, onRename, searchQuery, setSearchQuery }) {
  const [newDraftOpen, setNewDraftOpen] = useState(false);
  const [newDraftName, setNewDraftName] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const isMaster = viewId === 'master';
  const currentDraft = isMaster ? null : drafts.find(d => d.id === viewId);
  const accent = isMaster ? T.sage : T.amber;
  const accentSoft = isMaster ? T.sageSoft : T.amberSoft;
  const totalAssigned = master?.organizations.reduce(
    (acc, o) => acc + o.callings.filter(c => c.personId).length, 0
  ) || 0;

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        backgroundColor: T.bgSoft,
        borderBottom: `1px solid ${T.border}`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div className="mx-auto px-6 pt-5 pb-3" style={{ maxWidth: 1400 }}>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <div
              className=" uppercase mb-1"
              style={{ color: T.inkMuted, fontFamily: FONTS.body, fontWeight: 500, fontSize: 10, letterSpacing: '0.2em' }}
            >
              Rancho Carrillo Ward
            </div>
            <h1
              className=" leading-none"
              style={{ color: T.ink, fontFamily: FONTS.display, fontWeight: 400, letterSpacing: '-0.02em', fontSize: 28 }}
            >
              Calling Matrix
            </h1>
            <div
              className=" mt-1.5 flex items-center gap-3"
              style={{ color: T.inkMuted, fontFamily: FONTS.body, fontSize: 12 }}
            >
              <span>{master?.people?.length || 0} members</span>
              <span style={{ color: T.inkFaint }}>·</span>
              <span>{totalAssigned} assignments</span>
              <span style={{ color: T.inkFaint }}>·</span>
              <span>{master?.organizations?.length || 0} organizations</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: T.inkFaint }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search people or callings…"
                className="rounded-full py-1.5 pl-8 pr-3 w-56 focus:outline-none"
                style={{
                  backgroundColor: T.surface,
                  border: `1px solid ${T.border}`,
                  color: T.ink,
                  fontFamily: FONTS.body,
                  fontSize: 13,
                }}
              />
            </div>
          </div>
        </div>

        {/* mode tabs */}
        <div className="mt-5 flex items-center gap-1 flex-wrap">
          <button
            onClick={() => onSelect('master')}
            className="group flex items-center gap-2 py-2 px-3 rounded-md transition-colors"
            style={{
              backgroundColor: isMaster ? T.sageSoft : 'transparent',
              color: isMaster ? T.sage : T.inkMuted,
              border: `1px solid ${isMaster ? T.sage : 'transparent'}`,
              fontFamily: FONTS.body,
              fontWeight: isMaster ? 600 : 500,
              fontSize: 13,
            }}
          >
            <Lock size={13} strokeWidth={isMaster ? 2.5 : 1.75} />
            <span>Master</span>
            <span
              className=" ml-0.5"
              style={{ fontFamily: FONTS.mono, opacity: 0.7, fontSize: 10 }}
            >
              locked
            </span>
          </button>

          {drafts.map(d => {
            const active = d.id === viewId;
            return (
              <button
                key={d.id}
                onClick={() => onSelect(d.id)}
                className="group flex items-center gap-2 py-2 px-3 rounded-md transition-colors"
                style={{
                  backgroundColor: active ? T.amberSoft : 'transparent',
                  color: active ? T.amber : T.inkMuted,
                  border: `1px solid ${active ? T.amber : 'transparent'}`,
                  fontFamily: FONTS.body,
                  fontWeight: active ? 600 : 500,
                  fontSize: 13,
                  maxWidth: 260,
                }}
              >
                <FileEdit size={13} strokeWidth={active ? 2.5 : 1.75} />
                <span className=" truncate">{d.name}</span>
              </button>
            );
          })}

          <button
            onClick={() => setNewDraftOpen(true)}
            className="flex items-center gap-1.5 py-2 px-3 rounded-md transition-colors"
            style={{
              color: T.inkMuted,
              fontFamily: FONTS.body,
              fontWeight: 500,
              backgroundColor: 'transparent',
              border: `1px dashed ${T.borderStrong}`,
              fontSize: 13,
            }}
          >
            <Plus size={13} strokeWidth={1.75} />
            <span>New draft</span>
          </button>

          <div className="flex-1" />

          {currentDraft && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setRenameValue(currentDraft.name); setRenameOpen(true); }}
                className=" py-1.5 px-2.5 rounded-md"
                style={{ color: T.inkMuted, fontFamily: FONTS.body, backgroundColor: 'transparent', fontSize: 12 }}
              >
                Rename
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete draft "${currentDraft.name}"? This can't be undone.`)) onDelete(currentDraft.id);
                }}
                className=" py-1.5 px-2.5 rounded-md flex items-center gap-1"
                style={{ color: T.inkMuted, fontFamily: FONTS.body, backgroundColor: 'transparent', fontSize: 12 }}
              >
                <Trash2 size={12} strokeWidth={1.75} />
                Discard
              </button>
              <button
                onClick={() => {
                  if (confirm(`Promote "${currentDraft.name}" to Master? The current master will be replaced.`)) onPromote(currentDraft.id);
                }}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-md"
                style={{
                  backgroundColor: T.sage,
                  color: '#FFFFFF',
                  fontFamily: FONTS.body,
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                <Check size={13} strokeWidth={2.5} />
                Promote to Master
              </button>
            </div>
          )}
        </div>

        {/* mode indicator strip */}
        <div
          className="mt-3 flex items-center gap-2 py-1.5 px-3 rounded-md"
          style={{
            backgroundColor: accentSoft,
            color: accent,
            fontFamily: FONTS.body,
            fontSize: 12,
          }}
        >
          {isMaster ? (
            <>
              <Lock size={12} strokeWidth={2} />
              <span><strong style={{ fontWeight: 600 }}>Master is locked</strong> — only Set Apart toggles are editable. Create a draft to propose calling changes.</span>
            </>
          ) : (
            <>
              <FileEdit size={12} strokeWidth={2} />
              <span><strong style={{ fontWeight: 600 }}>Draft mode.</strong> Drag chips or tap-then-tap. Track Called + Sustained on each assignment. Master is untouched until you promote.</span>
            </>
          )}
        </div>
      </div>

      {/* new-draft modal */}
      {newDraftOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(28,25,23,0.4)' }}
          onClick={() => setNewDraftOpen(false)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-md"
            style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
            onClick={e => e.stopPropagation()}
          >
            <h2
              className=" mb-2"
              style={{ color: T.ink, fontFamily: FONTS.display, fontWeight: 500, fontSize: 20 }}
            >
              New draft
            </h2>
            <p className=" mb-4" style={{ color: T.inkMuted, fontFamily: FONTS.body, fontSize: 13 }}>
              A copy of the current master. Edits happen here; master stays locked.
            </p>
            <input
              type="text"
              autoFocus
              value={newDraftName}
              onChange={e => setNewDraftName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newDraftName.trim()) {
                  onNewDraft(newDraftName.trim());
                  setNewDraftName('');
                  setNewDraftOpen(false);
                }
              }}
              placeholder="e.g., April 2026 restructure"
              className="w-full py-2 px-3 rounded-md focus:outline-none"
              style={{
                backgroundColor: T.bgSoft,
                border: `1px solid ${T.border}`,
                color: T.ink,
                fontFamily: FONTS.body,
                fontSize: 14,
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setNewDraftOpen(false); setNewDraftName(''); }}
                className="py-1.5 px-3 rounded-md"
                style={{ color: T.inkMuted, fontFamily: FONTS.body, backgroundColor: 'transparent', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                disabled={!newDraftName.trim()}
                onClick={() => {
                  onNewDraft(newDraftName.trim());
                  setNewDraftName('');
                  setNewDraftOpen(false);
                }}
                className="py-1.5 px-3 rounded-md"
                style={{
                  backgroundColor: newDraftName.trim() ? T.amber : T.borderStrong,
                  color: '#FFFFFF',
                  fontFamily: FONTS.body,
                  fontWeight: 600,
                  opacity: newDraftName.trim() ? 1 : 0.5,
                  fontSize: 13,
                }}
              >
                Create draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* rename modal */}
      {renameOpen && currentDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(28,25,23,0.4)' }}
          onClick={() => setRenameOpen(false)}
        >
          <div
            className="rounded-lg p-6 w-full max-w-md"
            style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
            onClick={e => e.stopPropagation()}
          >
            <h2
              className=" mb-4"
              style={{ color: T.ink, fontFamily: FONTS.display, fontWeight: 500, fontSize: 20 }}
            >
              Rename draft
            </h2>
            <input
              type="text"
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && renameValue.trim()) {
                  onRename(currentDraft.id, renameValue.trim());
                  setRenameOpen(false);
                }
              }}
              className="w-full py-2 px-3 rounded-md focus:outline-none"
              style={{
                backgroundColor: T.bgSoft,
                border: `1px solid ${T.border}`,
                color: T.ink,
                fontFamily: FONTS.body,
                fontSize: 14,
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRenameOpen(false)}
                className="py-1.5 px-3 rounded-md"
                style={{ color: T.inkMuted, fontFamily: FONTS.body, backgroundColor: 'transparent', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                disabled={!renameValue.trim()}
                onClick={() => {
                  onRename(currentDraft.id, renameValue.trim());
                  setRenameOpen(false);
                }}
                className="py-1.5 px-3 rounded-md"
                style={{
                  backgroundColor: renameValue.trim() ? T.amber : T.borderStrong,
                  color: '#FFFFFF',
                  fontFamily: FONTS.body,
                  fontWeight: 600,
                  opacity: renameValue.trim() ? 1 : 0.5,
                  fontSize: 13,
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ----- main app -----

export default function App() {
  const [master, setMaster] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [viewId, setViewId] = useState('master');
  const [loading, setLoading] = useState(true);
  const [pickedUp, setPickedUp] = useState(null); // {personId, source}
  const [dragHover, setDragHover] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customPeople, setCustomPeople] = useState([]); // members added after initial seed
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  const peopleById = useMemo(() => {
    const map = {};
    INITIAL_DATA.people.forEach(p => { map[p.id] = p; });
    customPeople.forEach(p => { map[p.id] = p; });
    return map;
  }, [customPeople]);

  // bootstrap from storage
  useEffect(() => {
    (async () => {
      try {
        const storedMaster = await storageGet('matrix:master');
        const storedDrafts = await storageGet('matrix:drafts');
        const storedView = await storageGet('matrix:viewId');
        const storedCustom = await storageGet('matrix:customPeople');

        if (storedMaster) {
          const migrated = ensureMasterFields(storedMaster);
          setMaster(migrated);
          if (JSON.stringify(migrated) !== JSON.stringify(storedMaster)) {
            await storageSet('matrix:master', migrated);
          }
        } else {
          const seeded = ensureMasterFields({
            organizations: INITIAL_DATA.organizations,
            unassigned: INITIAL_DATA.unassigned,
            people: INITIAL_DATA.people,
            updatedAt: Date.now(),
          });
          await storageSet('matrix:master', seeded);
          setMaster(seeded);
        }
        const migratedDrafts = (storedDrafts || []).map(ensureDraftFields);
        setDrafts(migratedDrafts);
        if (storedView) setViewId(storedView);
        if (storedCustom && Array.isArray(storedCustom)) setCustomPeople(storedCustom);
      } catch (e) {
        console.error('Bootstrap failed', e);
        setMaster(ensureMasterFields({
          organizations: INITIAL_DATA.organizations,
          unassigned: INITIAL_DATA.unassigned,
          people: INITIAL_DATA.people,
          updatedAt: Date.now(),
        }));
      }
      setLoading(false);
    })();
  }, []);

  // persist viewId
  useEffect(() => {
    if (!loading) storageSet('matrix:viewId', viewId);
  }, [viewId, loading]);

  const currentView = viewId === 'master'
    ? master
    : drafts.find(d => d.id === viewId) || master;

  const isMaster = viewId === 'master';

  // global dragstart -> clear picked up
  useEffect(() => {
    function onDocDragStart() { setPickedUp(null); }
    document.addEventListener('dragstart', onDocDragStart);
    return () => document.removeEventListener('dragstart', onDocDragStart);
  }, []);

  // global click -> clear picked up when clicking outside a valid target
  useEffect(() => {
    function onDocClick(e) {
      if (!pickedUp) return;
      const t = e.target;
      // if click is not on a chip or drop zone, keep the picked-up state
      // (we rely on explicit interactions to clear)
    }
    return () => {};
  }, [pickedUp]);

  // ----- persistence helpers -----
  const saveDrafts = useCallback(async (next) => {
    setDrafts(next);
    await storageSet('matrix:drafts', next);
  }, []);
  const saveMaster = useCallback(async (next) => {
    setMaster(next);
    await storageSet('matrix:master', next);
  }, []);

  // ----- actions -----
  function handlePickup(personId, source) {
    if (isMaster) return;
    if (pickedUp && pickedUp.personId === personId &&
        pickedUp.source.type === source.type &&
        pickedUp.source.orgId === source.orgId &&
        pickedUp.source.callingId === source.callingId) {
      setPickedUp(null);
    } else {
      setPickedUp({ personId, source });
    }
  }

  function removeFromSource(state, source) {
    // mutates a cloned state
    if (source.type === 'calling') {
      for (const o of state.organizations) {
        if (o.id === source.orgId) {
          for (const c of o.callings) {
            if (c.id === source.callingId) { c.personId = null; break; }
          }
          break;
        }
      }
    } else if (source.type === 'staging') {
      state.staging = state.staging.filter(pid => pid !== source.tempId /* placeholder */);
    } else if (source.type === 'unassigned') {
      // we only remove first occurrence
      const i = state.unassigned.indexOf(source._personId);
      if (i >= 0) state.unassigned.splice(i, 1);
    }
  }

  // clean remove that identifies by personId (staging/unassigned are sets of ids so remove the first one)
  function removeFromSource2(state, source, personId) {
    if (source.type === 'calling') {
      for (const o of state.organizations) {
        if (o.id === source.orgId) {
          for (const c of o.callings) {
            if (c.id === source.callingId) { c.personId = null; }
          }
        }
      }
    } else if (source.type === 'staging') {
      const i = state.staging.indexOf(personId);
      if (i >= 0) state.staging.splice(i, 1);
    } else if (source.type === 'unassigned') {
      const i = state.unassigned.indexOf(personId);
      if (i >= 0) state.unassigned.splice(i, 1);
    }
  }

  function handleMove(data, dest) {
    if (isMaster) { setPickedUp(null); return; }
    const { personId, source } = data;

    // no-op: dropping back on the same slot
    if (source.type === dest.type &&
        source.orgId === dest.orgId &&
        source.callingId === dest.callingId) {
      setPickedUp(null);
      return;
    }

    const currentDraft = drafts.find(d => d.id === viewId);
    if (!currentDraft) return;

    const next = JSON.parse(JSON.stringify(currentDraft));
    next.staging = next.staging || [];
    next.unassigned = next.unassigned || [];

    // step 1: remove from source, clearing called/sustained on any vacated slot
    removeFromSource2(next, source, personId);
    if (source.type === 'calling') {
      for (const o of next.organizations) {
        if (o.id === source.orgId) {
          for (const c of o.callings) {
            if (c.id === source.callingId) { c.called = false; c.sustained = false; }
          }
        }
      }
    }

    // step 2: place at destination
    if (dest.type === 'calling') {
      for (const o of next.organizations) {
        if (o.id === dest.orgId) {
          for (const c of o.callings) {
            if (c.id === dest.callingId) {
              // if occupied, displace to staging and reset their called/sustained
              if (c.personId) {
                next.staging.push(c.personId);
              }
              c.personId = personId;
              // new assignment resets both tracking booleans
              c.called = false;
              c.sustained = false;
            }
          }
        }
      }
    } else if (dest.type === 'staging') {
      next.staging.push(personId);
    } else if (dest.type === 'unassigned') {
      next.unassigned.push(personId);
    }

    const nextDrafts = drafts.map(d => d.id === viewId ? next : d);
    saveDrafts(nextDrafts);
    setPickedUp(null);
  }

  // ----- toggle handlers -----
  async function toggleSetApart(orgId, callingId, value) {
    if (!master) return;
    const next = JSON.parse(JSON.stringify(master));
    for (const o of next.organizations) {
      if (o.id === orgId) {
        for (const c of o.callings) {
          if (c.id === callingId) { c.setApart = value; }
        }
      }
    }
    next.updatedAt = Date.now();
    await saveMaster(next);
  }

  async function toggleCalledOrSustained(orgId, callingId, field, value) {
    const currentDraft = drafts.find(d => d.id === viewId);
    if (!currentDraft) return;
    const next = JSON.parse(JSON.stringify(currentDraft));
    for (const o of next.organizations) {
      if (o.id === orgId) {
        for (const c of o.callings) {
          if (c.id === callingId) { c[field] = value; }
        }
      }
    }
    const nextDrafts = drafts.map(d => d.id === viewId ? next : d);
    await saveDrafts(nextDrafts);
  }

  const toggleCalled = (orgId, callingId, value) => toggleCalledOrSustained(orgId, callingId, 'called', value);
  const toggleSustained = (orgId, callingId, value) => toggleCalledOrSustained(orgId, callingId, 'sustained', value);

  // ----- draft operations -----
  async function createDraft(name) {
    const base = snapshotFromMaster(master, master.people);
    const d = {
      id: newId('draft'),
      name,
      createdAt: Date.now(),
      basedOn: master.updatedAt,
      ...base,
    };
    const next = [...drafts, d];
    await saveDrafts(next);
    setViewId(d.id);
  }

  async function deleteDraft(id) {
    const next = drafts.filter(d => d.id !== id);
    await saveDrafts(next);
    if (viewId === id) setViewId('master');
  }

  async function renameDraft(id, name) {
    const next = drafts.map(d => d.id === id ? { ...d, name } : d);
    await saveDrafts(next);
  }

  async function promoteDraft(id) {
    const d = drafts.find(x => x.id === id);
    if (!d) return;
    // staging must be empty to promote? No — warn if not, but allow.
    if (d.staging && d.staging.length > 0) {
      if (!confirm(`${d.staging.length} member(s) are still in Staging. Promoting will send them to Unassigned. Continue?`)) return;
    }
    // Build map of existing master assignments to preserve setApart where person didn't change
    const oldMap = {};
    master.organizations.forEach(o => o.callings.forEach(c => {
      if (c.personId) oldMap[c.id] = { personId: c.personId, setApart: !!c.setApart };
    }));
    // Strip draft-only fields (called/sustained) and set setApart appropriately
    const newOrgs = d.organizations.map(o => ({
      id: o.id,
      name: o.name,
      callings: o.callings.map(c => {
        const prev = oldMap[c.id];
        const setApart = c.personId && prev && prev.personId === c.personId ? prev.setApart : false;
        return { id: c.id, title: c.title, personId: c.personId, setApart };
      }),
    }));
    const newMaster = {
      organizations: newOrgs,
      unassigned: [...d.unassigned, ...(d.staging || [])],
      people: master.people,
      updatedAt: Date.now(),
    };
    await saveMaster(newMaster);
    await saveDrafts(drafts.filter(x => x.id !== id));
    setViewId('master');
  }

  // ----- add a new member to the ward -----
  async function addMember(name) {
    const trimmed = name.trim();
    if (!trimmed) return;

    // slugify and ensure uniqueness against every existing person id
    const base = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let id = base;
    let counter = 2;
    while (peopleById[id]) {
      id = `${base}-${counter}`;
      counter++;
    }

    const newPerson = { id, name: trimmed };
    const nextCustom = [...customPeople, newPerson];
    setCustomPeople(nextCustom);
    await storageSet('matrix:customPeople', nextCustom);

    // add to master.unassigned so they appear in the Members Without a Calling list
    const nextMaster = {
      ...master,
      unassigned: [...master.unassigned, id],
      updatedAt: Date.now(),
    };
    await saveMaster(nextMaster);

    // also push into every open draft so the new member shows up there too
    if (drafts.length > 0) {
      const nextDrafts = drafts.map(d => ({
        ...d,
        unassigned: [...(d.unassigned || []), id],
      }));
      await saveDrafts(nextDrafts);
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: T.bg, fontFamily: FONTS.body, color: T.inkMuted }}
      >
        Loading matrix…
      </div>
    );
  }

  const orgs = currentView.organizations;
  const unassigned = currentView.unassigned;
  const staging = currentView.staging || [];

  // derive stats for draft
  let statsDelta = null;
  if (!isMaster && master) {
    const masterMap = {};
    master.organizations.forEach(o => o.callings.forEach(c => {
      masterMap[c.id] = c.personId;
    }));
    let changed = 0;
    currentView.organizations.forEach(o => o.callings.forEach(c => {
      if (masterMap[c.id] !== c.personId) changed++;
    }));
    statsDelta = { changed, staging: staging.length };
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: T.bg, fontFamily: FONTS.body, color: T.ink }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        html, body { background: ${T.bg}; }
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        ::selection { background: ${T.amberSoft}; color: ${T.amber}; }
        [draggable="true"] { -webkit-user-drag: element; }
      `}</style>

      <Header
        viewId={viewId}
        master={master}
        drafts={drafts}
        onSelect={id => { setPickedUp(null); setViewId(id); }}
        onNewDraft={createDraft}
        onPromote={promoteDraft}
        onDelete={deleteDraft}
        onRename={renameDraft}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="mx-auto px-6 py-6" style={{ maxWidth: 1400 }}>

        {/* draft stats strip */}
        {!isMaster && statsDelta && (
          <div
            className="mb-5 flex items-center gap-4 py-2 px-3 rounded-md"
            style={{
              backgroundColor: T.surface,
              border: `1px solid ${T.border}`,
              fontFamily: FONTS.body,
              color: T.inkMuted,
              fontSize: 12,
            }}
          >
            <div className="flex items-baseline gap-1.5">
              <span style={{ fontFamily: FONTS.mono, color: T.ink, fontSize: 13, fontWeight: 600 }}>
                {statsDelta.changed}
              </span>
              <span>change{statsDelta.changed === 1 ? '' : 's'} from master</span>
            </div>
            <div style={{ color: T.inkFaint }}>·</div>
            <div className="flex items-baseline gap-1.5">
              <span style={{ fontFamily: FONTS.mono, color: T.ink, fontSize: 13, fontWeight: 600 }}>
                {statsDelta.staging}
              </span>
              <span>in staging</span>
            </div>
            {pickedUp && (
              <>
                <div style={{ color: T.inkFaint }}>·</div>
                <div className="flex items-center gap-1.5" style={{ color: T.amber }}>
                  <span style={{ fontWeight: 600 }}>Holding:</span>
                  <span>{peopleById[pickedUp.personId]?.name}</span>
                  <button
                    onClick={() => setPickedUp(null)}
                    className="p-0.5 rounded hover:opacity-70"
                    style={{ color: T.amber }}
                    aria-label="Release"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* top rail: Staging only (draft mode) */}
        {!isMaster && (
          <div className="grid gap-4 mb-6 grid-cols-1">
            <Rail
              title="Staging"
              icon={AlertCircle}
              people={staging}
              peopleById={peopleById}
              sourceType="staging"
              isMaster={isMaster}
              pickedUp={pickedUp}
              onPickup={handlePickup}
              onMove={handleMove}
              bg={T.stagingBg}
              borderColor={T.stagingBorder}
              helpText="displaced — awaiting reassignment"
              dragHover={dragHover}
              setDragHover={setDragHover}
            />
          </div>
        )}

        {/* Changes list (draft only) — sits between Staging and the org grid */}
        {!isMaster && (
          <div className="mb-6">
            <ChangesList
              master={master}
              draft={currentView}
              peopleById={peopleById}
            />
          </div>
        )}

        {/* org grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orgs.map(org => (
            <OrgCard
              key={org.id}
              org={org}
              peopleById={peopleById}
              isMaster={isMaster}
              pickedUp={pickedUp}
              onPickup={handlePickup}
              onMove={handleMove}
              onToggleSetApart={toggleSetApart}
              onToggleCalled={toggleCalled}
              onToggleSustained={toggleSustained}
              searchQuery={searchQuery}
              dragHover={dragHover}
              setDragHover={setDragHover}
            />
          ))}
        </div>

        {/* Unassigned at bottom */}
        <div className="mt-6">
          <Rail
            title="Members Without a Calling"
            icon={Users}
            people={unassigned}
            peopleById={peopleById}
            sourceType="unassigned"
            isMaster={isMaster}
            pickedUp={pickedUp}
            onPickup={handlePickup}
            onMove={handleMove}
            bg={T.unassignedBg}
            borderColor={T.unassignedBorder}
            helpText={isMaster ? 'master list of members without callings' : 'drag anyone here to release their calling'}
            dragHover={dragHover}
            setDragHover={setDragHover}
            onAdd={isMaster ? () => setAddMemberOpen(true) : undefined}
          />
        </div>

        {/* footer */}
        <div
          className="mt-10 py-6 text-center"
          style={{ color: T.inkFaint, fontFamily: FONTS.body, borderTop: `1px solid ${T.border}`, fontSize: 11 }}
        >
          Master last updated {new Date(master.updatedAt || Date.now()).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          {' · '}
          Changes persist on this device.
        </div>
      </div>

      {/* add-member modal */}
      {addMemberOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(28,25,23,0.4)' }}
          onClick={() => { setAddMemberOpen(false); setNewMemberName(''); }}
        >
          <div
            className="rounded-lg p-6 w-full max-w-md"
            style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
            onClick={e => e.stopPropagation()}
          >
            <h2
              className=" mb-2"
              style={{ color: T.ink, fontFamily: FONTS.display, fontWeight: 500, fontSize: 20 }}
            >
              Add a new member
            </h2>
            <p className=" mb-4" style={{ color: T.inkMuted, fontFamily: FONTS.body, fontSize: 13 }}>
              New members start in the Members Without a Calling list. You can move them to a calling from a draft.
            </p>
            <input
              type="text"
              autoFocus
              value={newMemberName}
              onChange={e => setNewMemberName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newMemberName.trim()) {
                  addMember(newMemberName.trim());
                  setNewMemberName('');
                  setAddMemberOpen(false);
                }
              }}
              placeholder="Full name"
              className="w-full py-2 px-3 rounded-md focus:outline-none"
              style={{
                backgroundColor: T.bgSoft,
                border: `1px solid ${T.border}`,
                color: T.ink,
                fontFamily: FONTS.body,
                fontSize: 14,
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setAddMemberOpen(false); setNewMemberName(''); }}
                className="py-1.5 px-3 rounded-md"
                style={{ color: T.inkMuted, fontFamily: FONTS.body, backgroundColor: 'transparent', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                disabled={!newMemberName.trim()}
                onClick={() => {
                  addMember(newMemberName.trim());
                  setNewMemberName('');
                  setAddMemberOpen(false);
                }}
                className="py-1.5 px-3 rounded-md"
                style={{
                  backgroundColor: newMemberName.trim() ? T.sage : T.borderStrong,
                  color: '#FFFFFF',
                  fontFamily: FONTS.body,
                  fontWeight: 600,
                  opacity: newMemberName.trim() ? 1 : 0.5,
                  fontSize: 13,
                }}
              >
                Add member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
