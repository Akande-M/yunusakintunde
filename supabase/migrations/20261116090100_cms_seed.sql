-- Seed: existing hardcoded site content, so the live site looks identical on day one.
-- Safe to re-run: each block only inserts when its table is empty.

insert into public.news_posts (slug, title, summary, category, body, hero_image_url, hero_alt, photos, status, published_at)
select * from (values
  ($s0$ibadan-ijebu-ode-road-flagoff$s0$, $s1$Sen Yunus Akintunde commends Tinubu at Ibadan–Ijebu-Ode road flag-off$s1$, $s2$Akintunde Commends Tinubu as Ibadan–Ijebu-Ode Road Reconstruction Begins, Pledges Greater Support for Tinubu in 2027.$s2$, $s3$Constituency$s3$, $s4$Senator representing Oyo Central Senatorial District, Most Distinguished Senator Yunus Abiodun Akintunde PhD, has commended President Bola Ahmed Tinubu for the reconstruction and dualisation of the 58-kilometre Ibadan–Ijebu-Ode Road, describing the project as a major intervention that will bring relief to residents and boost economic activities across the affected communities.

The Senator spoke at the project's flag-off ceremony held at the open field of Legacy Estate, Idi-Ape, Ibadan.

The Ibadan–Ijebu-Ode–Ago-Iwoye corridor runs through Oluyole Federal Constituency, which is within Oyo Central Senatorial District, represented by Senator Akintunde, making the project particularly important to the Senator and his constituents.

Senator Akintunde praised President Tinubu on behalf of the people of Oyo Central for approving the reconstruction and dualisation of the road, which has remained in a deplorable condition for years.

Representing President Tinubu at the ceremony, Ogun State Governor, Prince Dapo Abiodun, said the project demonstrated what purposeful leadership could accomplish when political will was driven by genuine concern for the welfare and prosperity of the people.

Governor Abiodun, conveying the President's message, described the Ibadan–Ijebu-Ode Road as too important to Oyo State, Ogun State, Lagos and Nigeria to be left unattended.

He said the Renewed Hope Agenda was moving “beyond promises into practical action,” noting that the project would improve mobility, strengthen commerce and create new opportunities for the people.

The Olubadan of Ibadan, Oba Rashidi Ladoja, also highlighted the importance of the project, noting that the poor condition of the road had created security challenges and left parts of the corridor vulnerable to criminal activities.

Oba Ladoja expressed optimism that the reconstruction would help reduce incidents of banditry and kidnapping while further strengthening the peaceful relationship between the people of Ibadan and Ijebu.

Also speaking, the Chairman of the House Committee on Works, Hon. Akin Alabi, said the project would “bring relief to the people after many years of travelling on the deplorable road.”

He assured that the people would cooperate with the Federal Government and the contractor to ensure the timely completion of the project.

In his remarks, Senator Akintunde praised President Tinubu and recalled the support Oyo State gave the All Progressives Congress (APC) during the last presidential election.

He stated that Oyo State delivered about 498,000 votes to the APC, making it the second-highest APC vote total in the South-West after Lagos, while noting that Oyo State recorded the highest percentage of support for the party in the South-West.

Senator Akintunde subsequently sought the consent of his constituents and other Oyo State residents present at the ceremony to make a commitment to President Tinubu that the state would surpass its previous electoral performance in the coming election.

“Can I promise Mr President on your behalf that we will do more than that in the coming election?” he asked.

The gathering responded with a resounding “Yes!”

Following the response, Senator Akintunde moved a motion adopting President Bola Ahmed Tinubu as the only presidential candidate the people would support in the 2027 election. The motion received an enthusiastic response from the gathering.

The Senator's declaration came against the backdrop of the Federal Government's renewed infrastructure interventions across Oyo State, including the approval for the immediate reconstruction and dualisation of the 70-kilometre Ibadan–Abeokuta Road.

The Ibadan–Ijebu-Ode Road is being reconstructed as a dual carriageway using continuous reinforced concrete pavement, with the project expected to improve transportation, facilitate commerce, strengthen connectivity and enhance access to markets and other economic opportunities.

Senator Akintunde called on residents and communities along the corridor to support the Federal Government and the contractor to ensure the timely and successful completion of the project.$s4$, $s5$/__l5e/assets-v1/5ff07b7f-7a75-4783-af0d-a0c7dcb054d9/road-flagoff-speech.jpg$s5$, $s6$Senator Yunus Akintunde addressing the gathering at the Ibadan–Ijebu-Ode road reconstruction flag-off ceremony$s6$, $s7$[{"url":"/__l5e/assets-v1/5ff07b7f-7a75-4783-af0d-a0c7dcb054d9/road-flagoff-speech.jpg","alt":"Senator Akintunde delivering his remarks at the flag-off ceremony","caption":"Senator Akintunde delivering his remarks at Legacy Estate, Idi-Ape, Ibadan."},{"url":"/__l5e/assets-v1/9ff80ef3-04a9-4cbc-9084-856c16c87e5b/road-flagoff-dignitaries.jpg","alt":"Dignitaries seated at the Ibadan–Ijebu-Ode road flag-off ceremony","caption":"Dignitaries at the ceremony, including representatives of the President and traditional leaders."},{"url":"/__l5e/assets-v1/514b8919-2ab4-43d5-99ce-2f06d9b2e023/road-flagoff-group.jpg","alt":"Senator Akintunde with party leaders and constituents at the flag-off","caption":"Senator Akintunde with party leaders and constituents at the event."}]$s7$::jsonb, 'published', $s8$2026-09-03T12:00:00.000Z$s8$::timestamptz),
  ($s9$senator-akintunde-tours-ict-hub-site-in-iroko$s9$, $s10$Senator Akintunde tours ICT hub site in Iroko$s10$, $s11$Construction progress update on the Oyo Central Tech & ICT Hub, part of the 2023 skills commitment.$s11$, $s12$Constituency$s12$, $s13$$s13$, $s14$/__l5e/assets-v1/669a896e-7e4d-47da-bdb0-baafa85f014a/ict-hub.jpg$s14$, $s15$Computer training room at the Iroko ICT hub$s15$, $s16$[]$s16$::jsonb, 'published', $s17$2026-08-24T12:00:00.000Z$s17$::timestamptz),
  ($s18$akintunde-2027-volunteer-drive-launches-in-ogbomoso$s18$, $s19$Akintunde 2027 volunteer drive launches in Ogbomoso$s19$, $s20$First wave of ward coordinators announced ahead of the re-election push.$s20$, $s21$2027 Campaign trail$s21$, $s22$$s22$, $s23$/__l5e/assets-v1/80001413-c649-489d-96db-87e4d181876e/yunus_biography3.jpg$s23$, $s24$Senator Yunus Abiodun Akintunde, PhD raising his fist$s24$, $s25$[]$s25$::jsonb, 'published', $s26$2026-08-18T12:00:00.000Z$s26$::timestamptz),
  ($s27$quarterly-town-hall-held-in-ogbomoso$s27$, $s28$Quarterly town hall held in Ogbomoso$s28$, $s29$Constituents raised road infrastructure and healthcare access as priorities.$s29$, $s30$Constituency$s30$, $s31$$s31$, $s32$/__l5e/assets-v1/14373712-7b88-423e-bd12-252faf7b04ed/townhall.jpg$s32$, $s33$Residents seated at a town hall meeting in Ogbomoso$s33$, $s34$[]$s34$::jsonb, 'published', $s35$2026-08-09T12:00:00.000Z$s35$::timestamptz),
  ($s36$youth-employability-bill-passes-second-reading$s36$, $s37$Youth employability bill passes second reading$s37$, $s38$Co-sponsored legislation moves forward with cross-party support.$s38$, $s39$Senate floor$s39$, $s40$$s40$, $s41$/__l5e/assets-v1/1595c81d-3cda-4626-9b40-e0192c71c237/senate.jpg$s41$, $s42$Senate chamber in session$s42$, $s43$[]$s43$::jsonb, 'published', $s44$2026-07-30T12:00:00.000Z$s44$::timestamptz),
  ($s45$press-akintunde-pushes-for-oyo-central-ict-investment$s45$, $s46$Press: “Akintunde pushes for Oyo Central ICT investment”$s46$, $s47$Coverage of the Senator's remarks on the floor of the National Assembly.$s47$, $s48$Media coverage$s48$, $s49$$s49$, $s50$/__l5e/assets-v1/c83f4afd-1eac-4c8f-84e4-11980a32c6b1/yunus_biography4.jpg$s50$, $s51$Portrait of Senator Yunus Abiodun Akintunde, PhD in white agbada$s51$, $s52$[]$s52$::jsonb, 'published', $s53$2026-07-18T12:00:00.000Z$s53$::timestamptz),
  ($s54$medical-outreach-reaches-1-200-residents-in-lagelu$s54$, $s55$Medical outreach reaches 1,200 residents in Lagelu$s55$, $s56$Ninth quarterly health awareness programme since taking office.$s56$, $s57$Constituency$s57$, $s58$$s58$, $s59$/__l5e/assets-v1/53b534b4-7a09-44e6-a0f6-984694f64e55/medical.jpg$s59$, $s60$Community medical outreach in Lagelu$s60$, $s61$[]$s61$::jsonb, 'published', $s62$2026-06-05T12:00:00.000Z$s62$::timestamptz)
) v where not exists (select 1 from public.news_posts);

insert into public.gallery_items (kind, url, alt, caption, category, archived, sort_order)
select * from (values
  ('image', $s63$/__l5e/assets-v1/1595c81d-3cda-4626-9b40-e0192c71c237/senate.jpg$s63$, $s64$Senate chamber in session$s64$, $s65$Plenary session, National Assembly$s65$, $s66$In Office$s66$, false, 0),
  ('image', $s67$/__l5e/assets-v1/fd3cca73-b34b-47f2-af24-5a080ce6d109/solar-night.jpg$s67$, $s68$Solar street lighting, borehole and ICT centre at night in Iroko Community$s68$, $s69$Iroko: solar lighting, borehole & ICT centre$s69$, $s70$Projects$s70$, false, 10),
  ('image', $s71$/__l5e/assets-v1/80001413-c649-489d-96db-87e4d181876e/yunus_biography3.jpg$s71$, $s72$Senator Akintunde raising his fist at a campaign gathering$s72$, $s73$Ward rally, Ogbomoso$s73$, $s74$2027 Campaign Trail$s74$, false, 20),
  ('image', $s75$/__l5e/assets-v1/5d783d2f-2747-4326-8ea6-2f67b177aa57/skills.jpg$s75$, $s76$Vocational skills training centre workshop$s76$, $s77$Skills centre, Oyo town$s77$, $s78$Projects$s78$, false, 30),
  ('image', $s79$/__l5e/assets-v1/14373712-7b88-423e-bd12-252faf7b04ed/townhall.jpg$s79$, $s80$Town hall meeting with residents$s80$, $s81$Quarterly town hall, Ogbomoso$s81$, $s82$In Office$s82$, false, 40),
  ('image', $s83$/__l5e/assets-v1/033031ac-5587-4487-ba06-eff1f7ff24bb/yunus_biography2.jpg$s83$, $s84$Senator Akintunde standing in a cap and polo shirt$s84$, $s85$Volunteer meet-up, Oyo town$s85$, $s86$2027 Campaign Trail$s86$, false, 50),
  ('image', $s87$/__l5e/assets-v1/53b534b4-7a09-44e6-a0f6-984694f64e55/medical.jpg$s87$, $s88$Medical outreach with nurses and residents$s88$, $s89$Medical outreach, Lagelu$s89$, $s90$Projects$s90$, false, 60),
  ('image', $s91$/__l5e/assets-v1/669a896e-7e4d-47da-bdb0-baafa85f014a/ict-hub.jpg$s91$, $s92$ICT hub training room$s92$, $s93$Walkthrough: inside the ICT hub$s93$, $s94$Videos$s94$, false, 70),
  ('image', $s95$/__l5e/assets-v1/51e02d63-cee3-4eed-8204-6a1a321d1924/yunus_biography1.jpg$s95$, $s96$Senator Akintunde making a victory sign, 2023 campaign portrait$s96$, $s97$2023 campaign portrait$s97$, $s98$2023 Archive$s98$, true, 80),
  ('image', $s99$/__l5e/assets-v1/c83f4afd-1eac-4c8f-84e4-11980a32c6b1/yunus_biography4.jpg$s99$, $s100$Senator Akintunde in white agbada, 2023 campaign portrait$s100$, $s101$2023 campaign photography$s101$, $s102$2023 Archive$s102$, true, 90)
) v where not exists (select 1 from public.gallery_items);

insert into public.projects (name, place, region, completed_label, image_url, alt, night, sort_order)
select * from (values
  ($s103$Solar street lighting, borehole & ICT centre$s103$, $s104$Iroko Community, Akinyele LG · Ward 4$s104$, $s105$Ibadan$s105$, $s106$Completed November 2024$s106$, $s107$/__l5e/assets-v1/fd3cca73-b34b-47f2-af24-5a080ce6d109/solar-night.jpg$s107$, $s108$Solar-powered street lights, a community borehole and an ICT centre at night in Iroko Community$s108$, true, 0),
  ($s109$Oyo Central Tech & ICT Hub$s109$, $s110$Iroko, Akinyele LG · Ward 4$s110$, $s111$Ibadan$s111$, $s112$Commissioned March 2025$s112$, $s113$/__l5e/assets-v1/669a896e-7e4d-47da-bdb0-baafa85f014a/ict-hub.jpg$s113$, $s114$Trainees at computer workstations inside the Oyo Central ICT hub$s114$, false, 10),
  ($s115$Vocational & skills training centre$s115$, $s116$Oyo town, Oyo West LGA · Ward 2$s116$, $s117$Oyo$s117$, $s118$Commissioned July 2024$s118$, $s119$/__l5e/assets-v1/5d783d2f-2747-4326-8ea6-2f67b177aa57/skills.jpg$s119$, $s120$Trainees at sewing machines and workbenches in the vocational skills centre$s120$, false, 20),
  ($s121$Quarterly medical outreach programme$s121$, $s122$Lagelu LGA · Wards 6–8$s122$, $s123$Others$s123$, $s124$Ninth edition, June 2026$s124$, $s125$/__l5e/assets-v1/53b534b4-7a09-44e6-a0f6-984694f64e55/medical.jpg$s125$, $s126$Health workers checking residents at a community medical outreach$s126$, false, 30),
  ($s127$Ward stakeholder assembly & town hall series$s127$, $s128$Ogbomoso North LGA · Ward 5$s128$, $s129$Ogbomoso$s129$, $s130$Fourteenth town hall, August 2026$s130$, $s131$/__l5e/assets-v1/14373712-7b88-423e-bd12-252faf7b04ed/townhall.jpg$s131$, $s132$Residents seated at a constituency town hall meeting$s132$, false, 40)
) v where not exists (select 1 from public.projects);

insert into public.commitments (list, title, detail, status, status_label, sort_order)
select * from (values
  ('kept', $s133$All-inclusive qualitative representation at the Nigerian Senate$s133$, $s134$Ongoing across all plenary sessions since inauguration in June 2023.$s134$, $s135$delivered$s135$, null, 0),
  ('kept', $s136$Sponsoring of beneficial bills$s136$, $s137$6 bills sponsored or co-sponsored to date.$s137$, $s138$delivered$s138$, null, 10),
  ('kept', $s139$Facilitation of impactful projects across Oyo Central$s139$, $s140$38 community projects delivered across Ibadan, Oyo and Ogbomoso zones.$s140$, $s141$delivered$s141$, null, 20),
  ('kept', $s142$Easily accessible senatorial office / secretariat$s142$, $s143$Constituency office open in Oyo town, staffed Monday to Friday.$s143$, $s144$delivered$s144$, null, 30),
  ('kept', $s145$Establishment of skills / vocational training centres$s145$, $s146$First centre commissioned in Oyo town; second planned for Ogbomoso.$s146$, $s147$delivered$s147$, null, 40),
  ('kept', $s148$Annual employability / job fair for graduates$s148$, $s149$Inaugural edition held in Oyo town, early 2026.$s149$, $s150$delivered$s150$, null, 50),
  ('kept', $s151$Tech / ICT Hub for youths in the district$s151$, $s152$Commissioned and open in Iroko Community, Akinyele LG.$s152$, $s153$delivered$s153$, null, 60),
  ('kept', $s154$Inter-party / community assembly of 5 stakeholders per ward$s154$, $s155$Rolled out across the wards of the district.$s155$, $s156$delivered$s156$, null, 70),
  ('kept', $s157$Quarterly medical checks & town hall meetings$s157$, $s158$14 town halls and 9 medical outreach events held since 2023.$s158$, $s159$delivered$s159$, null, 80),
  ('agenda', $s160$Complete the Tech/ICT Hub network and open a second vocational centre in Ogbomoso$s160$, $s161$Scaling the two flagship projects already proven in term one.$s161$, $s162$upcoming$s162$, $s163$2027 pledge$s163$, 0),
  ('agenda', $s164$Make the Oyo Central Job & Employability Fair an annual fixture$s164$, $s165$Connecting graduates directly with district and state employers each year.$s165$, $s166$upcoming$s166$, $s167$2027 pledge$s167$, 10),
  ('agenda', $s168$Expand solar-powered infrastructure to 20 additional communities$s168$, $s169$Building on 38 delivered projects with a measurable term-two target.$s169$, $s170$upcoming$s170$, $s171$2027 pledge$s171$, 20),
  ('agenda', $s172$Sponsor legislation on youth employability and energy access nationally$s172$, $s173$Taking Oyo Central's priorities to the floor of the Senate.$s173$, $s174$upcoming$s174$, $s175$2027 pledge$s175$, 30),
  ('agenda', $s176$Complete ward-level community assemblies in all remaining wards$s176$, $s177$Finishing the rollout at 100% ward coverage across the district.$s177$, $s178$upcoming$s178$, $s179$2027 pledge$s179$, 40)
) v where not exists (select 1 from public.commitments);

insert into public.endorsements (quote, name, role, sort_order)
select * from (values
  ($s180$A senator who delivers and reports back — that is the standard every representative should be held to.$s180$, $s181$[Party Leader Name]$s181$, $s182$APC, Oyo State Chapter$s182$, 0),
  ($s183$Senator Akintunde has been accessible and effective — the skills centre in Oyo town is already changing lives.$s183$, $s184$Alhaji [Community Leader Name]$s184$, $s185$Baale, Oyo West LGA$s185$, 10),
  ($s186$He shows up. Four town halls in Ogbomoso alone, and he listens before he acts.$s186$, $s187$[Constituent Name]$s187$, $s188$Ogbomoso resident & small business owner$s188$, 20)
) v where not exists (select 1 from public.endorsements);

insert into public.site_settings (key, value) values ($s189$contact$s189$, $s190${"email":"office@yunusakintunde.com","phone":"+234 (0) 800 000 0000","office":"Oyo town, Oyo West LGA, Oyo State","hours":"Mon–Fri, 9am–4pm"}$s190$::jsonb) on conflict (key) do nothing;
insert into public.site_settings (key, value) values ($s191$socials$s191$, $s192${"facebook":"","instagram":"","x":"","linkedin":"","youtube":""}$s192$::jsonb) on conflict (key) do nothing;
insert into public.site_settings (key, value) values ($s193$home$s193$, $s194${"heroEyebrow":"Oyo Central · Seeking re-election, 2027","heroTitle":"Four years of delivery. Now, I'm asking Oyo Central to let us continue the good work.","heroBody":"Senator Yunus Abiodun Akintunde, PhD, is the sitting Senator for Oyo Central Senatorial District — asking for a second term on the strength of 38 delivered projects, 6 sponsored bills, and a promise-tracker that shows exactly what has been kept.","stats":[{"n":"38","l":"Projects delivered"},{"n":"12","l":"LGAs & wards reached"},{"n":"6","l":"Bills sponsored"},{"n":"100%","l":"2023 promises delivered"}],"quote":"In 2023, Oyo Central gave me a mandate on the strength of a promise. Today, I am asking for a second term on the strength of a record — and a plan to continue the good work we started together.","campaignVideoUrl":"","campaignVideoCaption":"Headline campaign video: “Four years of delivery” — Akintunde 2027."}$s194$::jsonb) on conflict (key) do nothing;
