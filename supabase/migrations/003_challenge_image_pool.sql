-- ============================================================
-- 003: Challenge image pool + user assignment tracking
-- ============================================================

-- Pool of pre-seeded images per challenge (one row per image)
create table if not exists public.challenge_images (
  id              uuid primary key default gen_random_uuid(),
  challenge_id    uuid not null references public.challenges(id) on delete cascade,
  image_url       text not null,
  image_data      text not null,
  image_mime_type text not null default 'image/jpeg',
  reference_prompt text not null,
  seed_index      integer not null,
  created_at      timestamptz not null default now(),
  unique (challenge_id, seed_index)
);

alter table public.challenge_images enable row level security;
create policy "Authenticated users can read challenge images"
  on public.challenge_images for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert challenge images"
  on public.challenge_images for insert with check (auth.role() = 'authenticated');

-- Tracks which images each user has already seen per challenge
create table if not exists public.user_image_assignments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  challenge_id        uuid not null references public.challenges(id) on delete cascade,
  challenge_image_id  uuid not null references public.challenge_images(id) on delete cascade,
  assigned_at         timestamptz not null default now(),
  unique (user_id, challenge_image_id)
);

alter table public.user_image_assignments enable row level security;
create policy "Users can read own assignments"
  on public.user_image_assignments for select using (auth.uid() = user_id);
create policy "Users can insert own assignments"
  on public.user_image_assignments for insert with check (auth.uid() = user_id);

-- ============================================================
-- Replace old 3-challenge seed with 60 challenges (10/20/30)
-- ============================================================
delete from public.submissions;
delete from public.challenges;

-- BEGINNER (10 challenges, pass at 60%)
insert into public.challenges (title, description, difficulty, image_topic, min_accuracy_to_pass) values
  ('Misty Morning',      'Describe the soft light and atmosphere of an early morning scene.',                    'beginner', 'morning,mist,sunrise',        60),
  ('Ocean Calm',         'Capture the colors, horizon, and mood of a peaceful ocean view.',                     'beginner', 'ocean,sea,calm,water',        60),
  ('Forest Path',        'Describe the trees, light filtering through, and the path ahead.',                    'beginner', 'forest,path,trees,green',     60),
  ('Mountain Peak',      'Describe the summit, sky, and surrounding landscape.',                                'beginner', 'mountain,peak,snow,sky',      60),
  ('Flower Field',       'Capture the colors, variety, and expanse of a blooming field.',                       'beginner', 'flowers,field,colorful,bloom',60),
  ('Desert Dunes',       'Describe the sand textures, shadows, and vast emptiness.',                            'beginner', 'desert,dunes,sand,arid',      60),
  ('Waterfall',          'Describe the water flow, surrounding rocks, and mist.',                               'beginner', 'waterfall,rocks,nature,mist', 60),
  ('Autumn Leaves',      'Capture the colors, fallen leaves, and seasonal mood.',                               'beginner', 'autumn,leaves,fall,orange',   60),
  ('Snowy Village',      'Describe the snow-covered rooftops, quiet streets, and winter light.',                'beginner', 'snow,village,winter,cold',    60),
  ('Sunset Sky',         'Capture the gradient of colors, clouds, and the setting sun.',                        'beginner', 'sunset,sky,clouds,golden',    60);

-- INTERMEDIATE (20 challenges, pass at 70%)
insert into public.challenges (title, description, difficulty, image_topic, min_accuracy_to_pass) values
  ('Rainy Street',       'Describe reflections, wet pavement, and the urban atmosphere.',                       'intermediate', 'rain,street,city,reflection',  70),
  ('Cafe Interior',      'Capture the lighting, furniture, patrons, and cozy atmosphere.',                      'intermediate', 'cafe,interior,coffee,cozy',    70),
  ('Harbor at Dusk',     'Describe the boats, water reflections, and fading light.',                            'intermediate', 'harbor,boats,dusk,water',      70),
  ('Ancient Ruins',      'Capture the stonework, overgrowth, and sense of history.',                            'intermediate', 'ruins,ancient,stone,history',  70),
  ('Night Market',       'Describe the lights, stalls, crowds, and vibrant energy.',                            'intermediate', 'market,night,lights,crowd',    70),
  ('Cliffside View',     'Capture the dramatic drop, ocean below, and sky above.',                              'intermediate', 'cliff,ocean,dramatic,height',  70),
  ('Bamboo Grove',       'Describe the density, light filtering, and green tones.',                             'intermediate', 'bamboo,grove,green,japan',     70),
  ('Frozen Lake',        'Capture the ice texture, reflections, and surrounding landscape.',                    'intermediate', 'frozen,lake,ice,winter',       70),
  ('Vineyard Rows',      'Describe the ordered vines, rolling hills, and warm light.',                          'intermediate', 'vineyard,grapes,rows,tuscany', 70),
  ('Lighthouse Storm',   'Capture the dramatic waves, dark sky, and the lone lighthouse.',                      'intermediate', 'lighthouse,storm,waves,dark',  70),
  ('Cobblestone Alley',  'Describe the narrow passage, old buildings, and textures.',                           'intermediate', 'alley,cobblestone,old,europe', 70),
  ('Rice Terraces',      'Capture the layered fields, water reflections, and lush green.',                      'intermediate', 'rice,terraces,asia,green',     70),
  ('Autumn River',       'Describe the foliage colors, water flow, and reflections.',                           'intermediate', 'river,autumn,reflection,trees',70),
  ('Snowy Pine Forest',  'Capture the snow-laden branches, silence, and cold light.',                           'intermediate', 'pine,snow,forest,cold',        70),
  ('Tropical Beach',     'Describe the turquoise water, white sand, and palm trees.',                           'intermediate', 'tropical,beach,palm,turquoise',70),
  ('Old Library',        'Capture the shelves, books, light, and scholarly atmosphere.',                        'intermediate', 'library,books,old,interior',   70),
  ('Wheat Field',        'Describe the golden stalks, wind movement, and open sky.',                            'intermediate', 'wheat,field,golden,farm',      70),
  ('Canyon Walls',       'Capture the layered rock colors, scale, and shadows.',                                'intermediate', 'canyon,rocks,layers,desert',   70),
  ('Misty Valley',       'Describe the fog rolling through, distant hills, and soft light.',                    'intermediate', 'valley,mist,fog,hills',        70),
  ('Coastal Cliffs',     'Capture the rugged rock face, crashing waves, and sea spray.',                        'intermediate', 'coastal,cliffs,waves,rugged',  70);

-- ADVANCED (30 challenges, pass at 80%)
insert into public.challenges (title, description, difficulty, image_topic, min_accuracy_to_pass) values
  ('Bioluminescent Bay',    'Describe the glowing water, dark surroundings, and ethereal light.',               'advanced', 'bioluminescence,bay,glow,night',      80),
  ('Aurora Borealis',       'Capture the color bands, movement, and dark arctic landscape below.',              'advanced', 'aurora,northern lights,arctic,sky',   80),
  ('Volcanic Eruption',     'Describe the lava flow, ash cloud, and dramatic sky.',                             'advanced', 'volcano,lava,eruption,fire',          80),
  ('Underwater Coral',      'Capture the coral colors, fish, light rays, and depth.',                           'advanced', 'coral,reef,underwater,fish',          80),
  ('Sandstorm Desert',      'Describe the wall of sand, reduced visibility, and eerie light.',                  'advanced', 'sandstorm,desert,dust,dramatic',      80),
  ('Glacier Crevasse',      'Capture the blue ice tones, depth, and scale of the crevasse.',                    'advanced', 'glacier,ice,blue,crevasse',           80),
  ('Monsoon Flooding',      'Describe the submerged streets, murky water, and overcast sky.',                   'advanced', 'monsoon,flood,rain,street',           80),
  ('Cherry Blossom Night',  'Capture the lit blossoms, dark sky, and reflections on water.',                    'advanced', 'cherry blossom,night,japan,pink',     80),
  ('Foggy Redwood',         'Describe the towering trunks, fog, and filtered light.',                           'advanced', 'redwood,fog,tall,forest',             80),
  ('Salt Flats Mirror',     'Capture the perfect reflection, horizon line, and vast emptiness.',                'advanced', 'salt flats,reflection,sky,mirror',    80),
  ('Thunderstorm Plains',   'Describe the lightning bolt, dark clouds, and flat landscape.',                    'advanced', 'thunderstorm,lightning,plains,dark',  80),
  ('Mangrove Roots',        'Capture the tangled roots, murky water, and dense canopy.',                        'advanced', 'mangrove,roots,swamp,tropical',       80),
  ('Ice Cave Interior',     'Describe the blue light, ice formations, and tunnel perspective.',                  'advanced', 'ice cave,blue,formations,interior',   80),
  ('Lava Meets Ocean',      'Capture the steam, glowing lava, and dark volcanic rock.',                         'advanced', 'lava,ocean,steam,hawaii',             80),
  ('Dust Devil',            'Describe the spinning column of dust, dry landscape, and sky.',                    'advanced', 'dust devil,desert,spin,dry',          80),
  ('Fjord Sunrise',         'Capture the steep walls, calm water, and golden morning light.',                   'advanced', 'fjord,sunrise,norway,water',          80),
  ('Peat Bog',              'Describe the dark water, mossy ground, and overcast atmosphere.',                  'advanced', 'peat bog,moss,dark,wetland',          80),
  ('Cactus Bloom',          'Capture the vivid flower, spines, and arid surroundings.',                         'advanced', 'cactus,bloom,flower,desert',          80),
  ('Tidal Pool',            'Describe the creatures, rock textures, and trapped water.',                        'advanced', 'tidal pool,rocks,sea,creatures',      80),
  ('Bamboo Fog',            'Capture the dense stalks, rising mist, and diffused light.',                       'advanced', 'bamboo,fog,mist,dense',               80),
  ('Kelp Forest',           'Describe the swaying kelp, filtered light, and marine life.',                      'advanced', 'kelp,forest,underwater,ocean',        80),
  ('Meteor Shower',         'Capture the streaks of light, star field, and dark silhouette below.',             'advanced', 'meteor,shower,night sky,stars',       80),
  ('Flooded Temple',        'Describe the submerged columns, algae, and eerie stillness.',                      'advanced', 'temple,flooded,ruins,water',          80),
  ('Geothermal Pools',      'Capture the vivid colors, steam, and mineral deposits.',                           'advanced', 'geothermal,pools,colorful,steam',     80),
  ('Driftwood Beach',       'Describe the bleached wood, grey sky, and desolate shore.',                        'advanced', 'driftwood,beach,grey,desolate',       80),
  ('Rainforest Canopy',     'Capture the layered green, shafts of light, and dense foliage.',                   'advanced', 'rainforest,canopy,green,light',       80),
  ('Frozen Waterfall',      'Describe the ice columns, blue tones, and surrounding snow.',                      'advanced', 'frozen waterfall,ice,blue,winter',    80),
  ('Obsidian Field',        'Capture the black volcanic glass, sharp edges, and barren landscape.',             'advanced', 'obsidian,volcanic,black,field',       80),
  ('Swamp at Twilight',     'Describe the silhouetted trees, still water, and fading purple sky.',              'advanced', 'swamp,twilight,silhouette,purple',    80),
  ('Petrified Forest',      'Capture the stone logs, muted colors, and ancient stillness.',                     'advanced', 'petrified,forest,stone,ancient',      80);
