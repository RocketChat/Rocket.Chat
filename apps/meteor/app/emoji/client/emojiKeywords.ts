/**
 * Natural Language Emoji Keywords Mapping
 * Maps common words/phrases to relevant emoji shortcodes
 * Similar to WhatsApp, Slack, and Telegram emoji search
 */

export const emojiKeywords: Record<string, string[]> = {
	// ==================== EMOTIONS & FEELINGS ====================

	// Happy / Positive
	happy: ['smile', 'grinning', 'grin', 'smiley', 'blush', 'joy', 'laughing', 'relaxed', 'innocent', 'slightly_smiling_face'],
	joy: ['joy', 'laughing', 'grin', 'smile', 'blush', 'heart_eyes'],
	excited: ['star_struck', 'heart_eyes', 'partying_face', 'tada', 'fire', 'zap', 'boom'],
	love: ['heart', 'heart_eyes', 'kissing_heart', 'two_hearts', 'cupid', 'sparkling_heart', 'heartbeat', 'heartpulse', 'revolving_hearts', 'gift_heart', 'kiss', 'couple_with_heart', 'wedding'],
	loving: ['heart', 'heart_eyes', 'smiling_face_with_3_hearts', 'kissing_heart', 'two_hearts'],
	laugh: ['joy', 'laughing', 'rofl', 'grin', 'smile', 'sweat_smile', 'stuck_out_tongue_winking_eye'],
	lol: ['joy', 'rofl', 'laughing', 'grin', 'stuck_out_tongue_winking_eye'],
	haha: ['joy', 'laughing', 'rofl', 'grin', 'smile'],
	funny: ['joy', 'rofl', 'laughing', 'stuck_out_tongue_winking_eye', 'zany_face', 'clown'],
	cool: ['sunglasses', 'metal', 'fire', 'ice_cube', 'snowflake', 'star2', 'cool'],
	awesome: ['fire', 'star2', '100', 'trophy', 'tada', 'rocket', 'boom'],
	amazing: ['star_struck', 'heart_eyes', 'fire', 'sparkles', '100', 'trophy'],
	perfect: ['ok_hand', '100', 'white_check_mark', 'trophy', 'star2', 'clap'],
	beautiful: ['heart_eyes', 'sparkles', 'star2', 'rainbow', 'rose', 'cherry_blossom'],
	cute: ['heart_eyes', 'smiling_face_with_3_hearts', 'blush', 'kissing_heart', 'baby', 'cat', 'dog', 'rabbit'],
	sweet: ['heart', 'kissing_heart', 'candy', 'lollipop', 'chocolate_bar', 'honey_pot', 'cookie'],

	// Sad / Negative
	sad: ['cry', 'sob', 'disappointed', 'pensive', 'weary', 'tired_face', 'worried', 'frowning', 'white_frowning_face'],
	crying: ['cry', 'sob', 'loudly_crying_face', 'disappointed'],
	unhappy: ['disappointed', 'pensive', 'worried', 'white_frowning_face', 'slightly_frowning_face'],
	depressed: ['pensive', 'disappointed', 'cry', 'sob', 'broken_heart'],
	lonely: ['pensive', 'disappointed', 'cry', 'person_in_bed'],
	hurt: ['cry', 'sob', 'disappointed', 'broken_heart', 'bandage', 'face_with_head_bandage'],
	pain: ['face_with_head_bandage', 'dizzy_face', 'cold_sweat', 'cry', 'sob'],

	// Angry
	angry: ['rage', 'angry', 'triumph', 'imp', 'pouting_cat', 'face_with_symbols_over_mouth'],
	mad: ['rage', 'angry', 'triumph', 'imp', 'face_with_symbols_over_mouth'],
	furious: ['rage', 'face_with_symbols_over_mouth', 'triumph', 'imp', 'fire'],
	annoyed: ['unamused', 'expressionless', 'neutral_face', 'rolling_eyes', 'triumph'],
	frustrated: ['triumph', 'rage', 'confounded', 'weary', 'persevere'],
	hate: ['rage', 'angry', 'imp', 'face_with_symbols_over_mouth', 'skull'],

	// Scared / Worried
	scared: ['scream', 'fearful', 'cold_sweat', 'open_mouth', 'worried', 'flushed'],
	fear: ['scream', 'fearful', 'ghost', 'skull', 'cold_sweat'],
	afraid: ['scream', 'fearful', 'cold_sweat', 'worried'],
	worried: ['worried', 'cold_sweat', 'sweat', 'pensive', 'thinking'],
	nervous: ['cold_sweat', 'sweat', 'worried', 'flushed', 'grimacing'],
	anxious: ['worried', 'cold_sweat', 'sweat', 'grimacing', 'persevere'],
	shocked: ['scream', 'open_mouth', 'flushed', 'astonished', 'dizzy_face', 'exploding_head'],
	surprised: ['astonished', 'open_mouth', 'hushed', 'flushed', 'scream'],

	// Tired / Sick
	tired: ['tired_face', 'weary', 'sleepy', 'sleeping', 'zzz', 'yawning_face'],
	sleepy: ['sleepy', 'sleeping', 'zzz', 'tired_face', 'yawning_face', 'bed', 'person_in_bed'],
	exhausted: ['tired_face', 'weary', 'dizzy_face', 'sweat', 'persevere'],
	sick: ['face_with_thermometer', 'sneezing_face', 'nauseated_face', 'face_vomiting', 'mask', 'pill', 'thermometer'],
	ill: ['face_with_thermometer', 'sneezing_face', 'nauseated_face', 'mask', 'pill'],
	bored: ['unamused', 'expressionless', 'neutral_face', 'sleeping', 'yawning_face'],

	// Confused / Thinking
	confused: ['confused', 'thinking', 'face_with_raised_eyebrow', 'face_with_monocle', 'question'],
	thinking: ['thinking', 'thought_balloon', 'brain', 'face_with_monocle'],
	wondering: ['thinking', 'thought_balloon', 'question', 'face_with_raised_eyebrow'],
	curious: ['face_with_monocle', 'thinking', 'eyes', 'mag'],

	// ==================== REACTIONS ====================

	// Positive Reactions
	yes: ['thumbsup', 'white_check_mark', 'ok', 'heavy_check_mark', '+1', 'ok_hand'],
	ok: ['ok_hand', 'thumbsup', 'white_check_mark', 'ok', '+1'],
	okay: ['ok_hand', 'thumbsup', 'white_check_mark', 'ok', '+1'],
	good: ['thumbsup', 'ok_hand', '+1', '100', 'fire', 'clap'],
	great: ['fire', 'star2', '100', 'tada', 'trophy', 'clap', 'raised_hands'],
	nice: ['thumbsup', 'ok_hand', 'clap', 'raised_hands', 'star2', 'fire', '100'],
	thanks: ['pray', 'raised_hands', 'clap', 'heart', 'blush'],
	thank: ['pray', 'raised_hands', 'clap', 'heart', 'blush'],
	please: ['pray', 'point_right', 'pleading_face'],
	welcome: ['wave', 'smile', 'blush', 'hugging', 'handshake'],
	congratulations: ['tada', 'confetti_ball', 'clap', 'trophy', 'champagne', 'partying_face'],
	congrats: ['tada', 'confetti_ball', 'clap', 'trophy', 'champagne', 'partying_face'],
	well_done: ['clap', '100', 'fire', 'trophy', 'medal', 'star2'],
	bravo: ['clap', '100', 'fire', 'trophy', 'tada'],
	agree: ['thumbsup', 'white_check_mark', 'nod', 'ok_hand', '+1', '100'],
	support: ['muscle', 'raised_hands', 'clap', 'heart', 'handshake'],

	// Negative Reactions
	no: ['thumbsdown', 'x', 'negative_squared_cross_mark', '-1', 'no_entry_sign', 'no_good'],
	nope: ['thumbsdown', 'x', 'no_entry_sign', '-1'],
	bad: ['thumbsdown', '-1', 'poop', 'x'],
	wrong: ['x', 'negative_squared_cross_mark', 'no_entry_sign', 'thumbsdown'],
	disagree: ['thumbsdown', 'x', '-1', 'no_good'],
	stop: ['stop_sign', 'octagonal_sign', 'raised_hand', 'no_entry'],
	wait: ['raised_hand', 'hourglass', 'timer', 'clock'],

	// ==================== ACTIONS & ACTIVITIES ====================

	// Communication
	hello: ['wave', 'smile', 'raising_hand', 'hello', 'vulcan'],
	hi: ['wave', 'smile', 'raising_hand', 'blush'],
	hey: ['wave', 'smile', 'raising_hand', 'yo'],
	bye: ['wave', 'v', 'kissing_heart'],
	goodbye: ['wave', 'v', 'heart', 'cry'],
	call: ['phone', 'calling', 'telephone_receiver', 'iphone'],
	message: ['speech_balloon', 'envelope', 'email', 'incoming_envelope'],
	talk: ['speech_balloon', 'speaking_head', 'mega', 'loudspeaker'],
	speak: ['speaking_head', 'speech_balloon', 'microphone', 'mega'],
	listen: ['ear', 'headphones', 'musical_note'],
	quiet: ['shushing_face', 'mute', 'zipper_mouth'],
	secret: ['shushing_face', 'zipper_mouth', 'lock', 'key'],

	// Celebrations
	party: ['tada', 'confetti_ball', 'balloon', 'partying_face', 'champagne', 'dancer', 'disco'],
	celebrate: ['tada', 'confetti_ball', 'partying_face', 'champagne', 'clap', 'balloon'],
	birthday: ['birthday', 'cake', 'balloon', 'tada', 'confetti_ball', 'gift'],
	christmas: ['christmas_tree', 'santa', 'gift', 'snowman', 'snowflake', 'star2'],
	newyear: ['fireworks', 'sparkler', 'champagne', 'confetti_ball', 'tada'],
	wedding: ['wedding', 'ring', 'bride_with_veil', 'man_in_tuxedo', 'church', 'heart'],
	anniversary: ['heart', 'two_hearts', 'gift', 'champagne', 'rose', 'ring'],

	// Work & Study
	work: ['briefcase', 'computer', 'keyboard', 'office', 'man_office_worker', 'woman_office_worker', 'hammer'],
	job: ['briefcase', 'office', 'computer', 'man_office_worker', 'woman_office_worker'],
	meeting: ['handshake', 'office', 'speaking_head', 'calendar', 'clock'],
	study: ['books', 'book', 'pencil', 'memo', 'man_student', 'woman_student', 'graduation_cap'],
	learn: ['books', 'book', 'brain', 'bulb', 'pencil'],
	school: ['school', 'books', 'pencil', 'memo', 'graduation_cap', 'man_student', 'woman_student'],
	homework: ['books', 'pencil', 'memo', 'computer', 'writing_hand'],
	exam: ['memo', 'pencil', 'books', 'sweat', 'cold_sweat'],
	idea: ['bulb', 'brain', 'thought_balloon', 'sparkles', 'star2'],
	creative: ['art', 'bulb', 'rainbow', 'sparkles', 'brain'],

	// Sports & Exercise
	sport: ['soccer', 'basketball', 'football', 'tennis', 'trophy', 'medal', 'muscle'],
	sports: ['soccer', 'basketball', 'football', 'tennis', 'trophy', 'medal', 'running'],
	exercise: ['muscle', 'running', 'person_lifting_weights', 'person_biking', 'sweat'],
	gym: ['muscle', 'person_lifting_weights', 'dumbbell', 'sweat'],
	run: ['running', 'person_running', 'man_running', 'woman_running', 'dash'],
	running: ['running', 'person_running', 'man_running', 'woman_running', 'dash', 'athletic_shoe'],
	football: ['football', 'soccer', 'goal', 'sports_medal'],
	soccer: ['soccer', 'goal', 'sports_medal', 'trophy'],
	basketball: ['basketball', 'person_bouncing_ball', 'trophy'],
	tennis: ['tennis', 'racquet', 'trophy'],
	swim: ['person_swimming', 'man_swimming', 'woman_swimming', 'swimmer', 'ocean', 'water_wave'],
	swimming: ['person_swimming', 'swimmer', 'ocean', 'water_wave'],
	bike: ['person_biking', 'bicyclist', 'bike', 'mountain_bicyclist'],
	cycling: ['person_biking', 'bicyclist', 'bike', 'man_biking', 'woman_biking'],
	yoga: ['person_in_lotus_position', 'woman_in_lotus_position', 'man_in_lotus_position', 'pray'],
	dance: ['dancer', 'man_dancing', 'dancing_women', 'dancing_men', 'disco'],
	win: ['trophy', 'medal', 'first_place', 'star2', 'confetti_ball', 'tada'],
	winner: ['trophy', 'first_place', 'medal', 'star2', 'crown'],
	champion: ['trophy', 'first_place', 'medal', 'crown', 'star2'],
	goal: ['goal', 'dart', 'trophy', 'tada', 'soccer'],

	// ==================== FOOD & DRINK ====================

	// General Food
	food: ['hamburger', 'pizza', 'taco', 'burrito', 'fries', 'hot_dog', 'poultry_leg', 'meat_on_bone', 'curry'],
	hungry: ['drooling_face', 'yum', 'hamburger', 'pizza', 'fork_and_knife'],
	eat: ['fork_and_knife', 'yum', 'hamburger', 'pizza', 'spaghetti'],
	eating: ['fork_and_knife', 'yum', 'hamburger', 'pizza'],
	delicious: ['yum', 'drooling_face', 'heart_eyes', 'ok_hand', 'kissing_closed_eyes'],
	yummy: ['yum', 'drooling_face', 'heart_eyes', 'tongue'],
	tasty: ['yum', 'drooling_face', 'ok_hand', 'kissing_closed_eyes'],

	// Specific Foods
	pizza: ['pizza', 'cheese', 'tomato'],
	burger: ['hamburger', 'fries', 'cheese'],
	sandwich: ['sandwich', 'bread', 'cheese', 'bacon'],
	pasta: ['spaghetti', 'fork_and_knife'],
	rice: ['rice', 'curry', 'rice_ball', 'rice_cracker'],
	noodles: ['ramen', 'spaghetti', 'chopsticks'],
	sushi: ['sushi', 'fish', 'rice'],
	chicken: ['poultry_leg', 'chicken', 'rooster'],
	meat: ['meat_on_bone', 'cut_of_meat', 'bacon', 'poultry_leg'],
	fish: ['fish', 'tropical_fish', 'sushi', 'fishing_pole_and_fish', 'blowfish', 'shark', 'whale', 'dolphin'],
	egg: ['egg', 'fried_egg', 'hatching_chick'],
	bread: ['bread', 'baguette_bread', 'croissant', 'pretzel'],
	cheese: ['cheese', 'pizza', 'hamburger'],
	salad: ['salad', 'cucumber', 'leafy_green', 'tomato', 'carrot'],
	vegetable: ['carrot', 'corn', 'broccoli', 'cucumber', 'tomato', 'potato', 'leafy_green'],
	vegetables: ['carrot', 'corn', 'broccoli', 'cucumber', 'tomato', 'potato', 'leafy_green', 'salad'],
	fruit: ['apple', 'banana', 'orange', 'grapes', 'watermelon', 'strawberry', 'peach', 'mango'],
	fruits: ['apple', 'banana', 'orange', 'grapes', 'watermelon', 'strawberry', 'peach', 'cherry'],
	apple: ['apple', 'green_apple'],
	banana: ['banana'],
	orange: ['orange', 'tangerine', 'orange_circle', 'orange_heart', 'carrot', 'basketball'],
	strawberry: ['strawberry'],
	cake: ['cake', 'birthday', 'shortcake', 'cupcake'],
	chocolate: ['chocolate_bar', 'cookie', 'doughnut'],
	candy: ['candy', 'lollipop', 'chocolate_bar', 'cookie'],
	icecream: ['ice_cream', 'icecream', 'shaved_ice'],
	cookie: ['cookie', 'chocolate_bar'],
	dessert: ['cake', 'ice_cream', 'doughnut', 'cookie', 'chocolate_bar', 'candy'],

	// Drinks
	drink: ['coffee', 'tea', 'beer', 'wine_glass', 'tropical_drink', 'cocktail', 'cup_with_straw'],
	drinks: ['coffee', 'tea', 'beer', 'wine_glass', 'tropical_drink', 'cocktail'],
	coffee: ['coffee', 'hot_beverage', 'espresso'],
	tea: ['tea', 'hot_beverage', 'teacup_without_handle'],
	water: ['droplet', 'potable_water', 'cup_with_straw', 'ocean', 'water_wave'],
	beer: ['beer', 'beers', 'clinking_glasses'],
	wine: ['wine_glass', 'grapes', 'clinking_glasses'],
	cocktail: ['cocktail', 'tropical_drink', 'champagne'],
	juice: ['tropical_drink', 'cup_with_straw', 'orange', 'apple'],
	milk: ['milk', 'glass_of_milk', 'baby_bottle', 'cow'],
	alcohol: ['beer', 'wine_glass', 'cocktail', 'champagne', 'tumbler_glass', 'sake'],
	cheers: ['clinking_glasses', 'beers', 'champagne', 'wine_glass', 'tada'],

	// ==================== NATURE & WEATHER ====================

	// Weather
	sun: ['sunny', 'sun_with_face', 'sunrise', 'sunrise_over_mountains', 'sun_behind_cloud'],
	sunny: ['sunny', 'sun_with_face', 'sunrise', 'sunglasses'],
	hot: ['fire', 'sunny', 'thermometer', 'hot_face', 'sweat', 'flame'],
	warm: ['sunny', 'fire', 'thermometer'],
	cold: ['cold_face', 'snowflake', 'ice_cube', 'freezing_face', 'snowman'],

	rain: ['cloud_rain', 'umbrella', 'droplet', 'thunder_cloud_rain', 'closed_umbrella'],
	rainy: ['cloud_rain', 'umbrella', 'droplet', 'thunder_cloud_rain'],
	snow: ['snowflake', 'snowman', 'cloud_snow', 'snow_capped_mountain'],
	snowing: ['snowflake', 'snowman', 'cloud_snow'],
	storm: ['thunder_cloud_rain', 'zap', 'cloud_lightning', 'tornado', 'wind_blowing_face'],
	thunder: ['zap', 'thunder_cloud_rain', 'cloud_lightning'],
	lightning: ['zap', 'cloud_lightning', 'thunder_cloud_rain', 'high_voltage'],
	wind: ['wind_blowing_face', 'dash', 'leaves', 'tornado'],
	windy: ['wind_blowing_face', 'dash', 'leaves'],
	cloud: ['cloud', 'white_sun_cloud', 'sun_behind_cloud', 'partly_sunny'],
	cloudy: ['cloud', 'white_sun_cloud', 'sun_behind_cloud'],
	rainbow: ['rainbow', 'sparkles', 'star2'],
	fog: ['fog', 'cloud'],

	// Nature
	nature: ['evergreen_tree', 'deciduous_tree', 'palm_tree', 'flower_playing_cards', 'sunflower', 'mountain'],
	tree: ['evergreen_tree', 'deciduous_tree', 'palm_tree', 'christmas_tree'],
	flower: ['flower_playing_cards', 'sunflower', 'rose', 'tulip', 'cherry_blossom', 'hibiscus', 'blossom'],
	flowers: ['bouquet', 'rose', 'tulip', 'sunflower', 'cherry_blossom', 'hibiscus'],
	plant: ['seedling', 'herb', 'potted_plant', 'cactus', 'shamrock', 'four_leaf_clover'],
	garden: ['sunflower', 'rose', 'tulip', 'potted_plant', 'seedling', 'herb'],
	forest: ['evergreen_tree', 'deciduous_tree', 'national_park', 'leaves'],
	mountain: ['mountain', 'snow_capped_mountain', 'mount_fuji', 'camping', 'sunrise_over_mountains'],
	beach: ['beach', 'palm_tree', 'ocean', 'umbrella_on_ground', 'sunny', 'sunglasses'],
	ocean: ['ocean', 'water_wave', 'fish', 'whale', 'dolphin', 'beach'],
	sea: ['ocean', 'water_wave', 'fish', 'whale', 'dolphin', 'anchor', 'ship'],
	river: ['ocean', 'water_wave', 'fish', 'canoe'],
	lake: ['ocean', 'fish', 'duck', 'swan'],
	sky: ['cloud', 'sun_behind_cloud', 'rainbow', 'star2', 'moon', 'sunny'],
	star: ['star', 'star2', 'sparkles', 'dizzy', 'glowing_star'],
	stars: ['star', 'star2', 'sparkles', 'milky_way'],
	moon: ['moon', 'full_moon', 'new_moon', 'crescent_moon', 'full_moon_with_face'],
	night: ['moon', 'star2', 'night_with_stars', 'city_sunset', 'sleeping'],
	space: ['rocket', 'milky_way', 'star2', 'alien', 'flying_saucer', 'ringed_planet'],

	// Animals
	animal: ['dog', 'cat', 'bear', 'tiger', 'lion_face', 'monkey', 'elephant', 'bird'],
	animals: ['dog', 'cat', 'bear', 'tiger', 'lion_face', 'monkey', 'elephant', 'bird'],
	dog: ['dog', 'dog2', 'guide_dog', 'poodle', 'wolf', 'fox'],
	puppy: ['dog', 'dog2', 'paw_prints'],
	cat: ['cat', 'cat2', 'smiley_cat', 'heart_eyes_cat', 'black_cat'],
	kitten: ['cat', 'cat2', 'smiley_cat'],
	bird: ['bird', 'baby_chick', 'eagle', 'owl', 'parrot', 'dove'],

	bear: ['bear', 'teddy_bear', 'polar_bear', 'panda_face'],
	lion: ['lion_face', 'tiger', 'leopard'],
	tiger: ['tiger', 'tiger2', 'leopard'],
	monkey: ['monkey', 'monkey_face', 'see_no_evil', 'hear_no_evil', 'speak_no_evil'],
	elephant: ['elephant', 'mammoth'],
	horse: ['horse', 'racehorse', 'unicorn'],
	cow: ['cow', 'cow2', 'ox', 'water_buffalo'],
	pig: ['pig', 'pig2', 'pig_nose', 'boar'],
	rabbit: ['rabbit', 'rabbit2', 'bunny'],
	mouse: ['mouse', 'mouse2', 'rat'],
	snake: ['snake', 'lizard', 'dragon'],
	bug: ['bug', 'ant', 'bee', 'beetle', 'butterfly', 'spider', 'cricket'],
	insect: ['bug', 'ant', 'bee', 'beetle', 'butterfly', 'spider', 'ladybug'],
	butterfly: ['butterfly'],
	bee: ['bee', 'honeybee', 'honey_pot'],

	// ==================== OBJECTS & THINGS ====================

	// Technology
	phone: ['iphone', 'calling', 'telephone_receiver', 'telephone', 'mobile_phone_off'],
	computer: ['computer', 'desktop', 'laptop', 'keyboard', 'mouse_three_button'],
	laptop: ['computer', 'laptop'],
	email: ['email', 'envelope', 'incoming_envelope', 'outbox_tray', 'inbox_tray'],
	internet: ['globe_with_meridians', 'signal_strength', 'satellite'],
	camera: ['camera', 'camera_with_flash', 'video_camera', 'movie_camera'],
	photo: ['camera', 'frame_photo', 'sunrise', 'city_sunset'],
	video: ['video_camera', 'movie_camera', 'clapper', 'film_frames'],
	music: ['musical_note', 'notes', 'headphones', 'guitar', 'microphone', 'saxophone', 'violin', 'drum'],
	headphones: ['headphones', 'musical_note', 'notes'],
	game: ['video_game', 'game_die', 'joystick', 'chess_pawn', 'slot_machine'],
	gaming: ['video_game', 'joystick', 'game_die', 'desktop'],

	// Time
	time: ['clock', 'watch', 'hourglass', 'alarm_clock', 'timer', 'stopwatch'],
	clock: ['clock', 'alarm_clock', 'timer', 'watch'],
	morning: ['sunrise', 'sunrise_over_mountains', 'sun_with_face', 'coffee', 'rooster'],
	afternoon: ['sunny', 'sun_with_face'],
	evening: ['city_sunset', 'night_with_stars', 'moon'],
	today: ['calendar', 'date', 'spiral_calendar'],
	tomorrow: ['calendar', 'soon', 'arrow_right'],
	yesterday: ['calendar', 'back', 'arrow_left'],
	weekend: ['partying_face', 'tada', 'tropical_drink', 'beer', 'sleeping'],
	holiday: ['airplane', 'beach', 'palm_tree', 'tada', 'gift', 'christmas_tree'],
	vacation: ['airplane', 'beach', 'palm_tree', 'camera', 'luggage', 'tropical_drink'],

	// Money
	money: ['money_with_wings', 'dollar', 'euro', 'pound', 'yen', 'moneybag', 'credit_card', 'gem'],
	cash: ['dollar', 'moneybag', 'money_with_wings', 'atm'],
	rich: ['moneybag', 'gem', 'crown', 'dollar', 'money_with_wings'],
	expensive: ['moneybag', 'gem', 'money_with_wings', 'dollar'],
	cheap: ['dollar', 'coin'],
	shopping: ['shopping_bags', 'shopping_cart', 'credit_card', 'gift', 'dress', 'shoe'],
	buy: ['shopping_cart', 'shopping_bags', 'credit_card', 'moneybag'],
	gift: ['gift', 'ribbon', 'gift_heart', 'wrapped_gift'],
	present: ['gift', 'ribbon', 'gift_heart', 'wrapped_gift', 'tada'],

	// Transport
	car: ['car', 'red_car', 'blue_car', 'taxi', 'police_car', 'racing_car'],
	drive: ['car', 'red_car', 'racing_car', 'taxi'],
	driving: ['car', 'red_car', 'oncoming_automobile'],
	bus: ['bus', 'trolleybus', 'minibus', 'oncoming_bus'],
	train: ['train', 'railway_car', 'bullettrain_side', 'bullettrain_front', 'metro', 'tram'],
	plane: ['airplane', 'airplane_departure', 'airplane_arriving', 'flight_departure', 'flight_arrival'],
	airplane: ['airplane', 'airplane_departure', 'airplane_arriving'],
	flight: ['airplane', 'airplane_departure', 'airplane_arriving', 'flight_departure'],
	travel: ['airplane', 'luggage', 'world_map', 'compass', 'beach', 'mountain', 'camera'],
	trip: ['airplane', 'luggage', 'car', 'bus', 'train', 'camera'],
	boat: ['boat', 'ship', 'sailboat', 'motor_boat', 'canoe', 'anchor'],
	ship: ['ship', 'cruise_ship', 'anchor', 'sailboat'],

	// Home
	home: ['house', 'house_with_garden', 'homes', 'family', 'heart'],
	house: ['house', 'house_with_garden', 'homes', 'building_construction'],
	room: ['bed', 'couch', 'door', 'window'],
	bed: ['bed', 'sleeping_accommodation', 'person_in_bed', 'sleeping', 'zzz'],
	sleep: ['zzz', 'sleeping', 'bed', 'person_in_bed', 'sleepy', 'crescent_moon'],
	sleeping: ['zzz', 'sleeping', 'bed', 'person_in_bed', 'sleepy'],
	door: ['door', 'key', 'lock'],
	key: ['key', 'key2', 'lock', 'door'],
	lock: ['lock', 'unlock', 'key', 'closed_lock_with_key'],

	// Health
	health: ['heart', 'pill', 'syringe', 'hospital', 'ambulance', 'stethoscope'],
	doctor: ['man_health_worker', 'woman_health_worker', 'stethoscope', 'hospital', 'pill'],
	hospital: ['hospital', 'ambulance', 'pill', 'syringe', 'man_health_worker', 'woman_health_worker'],
	medicine: ['pill', 'syringe', 'hospital', 'stethoscope'],
	vaccine: ['syringe', 'pill', 'hospital'],
	heart: ['heart', 'heartbeat', 'heartpulse', 'two_hearts', 'sparkling_heart'],
	broken: ['broken_heart', 'boom', 'collision'],

	// ==================== PEOPLE & BODY ====================

	// People
	man: ['man', 'boy', 'male', 'person', 'adult'],
	woman: ['woman', 'girl', 'female', 'person', 'adult'],
	boy: ['boy', 'man', 'child'],
	girl: ['girl', 'woman', 'child'],
	baby: ['baby', 'infant', 'child', 'baby_bottle'],
	family: ['family', 'man_woman_boy', 'man_woman_girl', 'couple', 'house'],
	friend: ['handshake', 'people_holding_hands', 'two_men_holding_hands', 'two_women_holding_hands', 'hugging'],
	friends: ['handshake', 'people_holding_hands', 'hugging', 'beers', 'clinking_glasses'],

	// Body Parts
	hand: ['wave', 'raised_hand', 'hand_splayed', 'ok_hand', 'thumbsup', 'thumbsdown', 'fist', 'punch', 'clap'],
	hands: ['raised_hands', 'clap', 'open_hands', 'palms_up_together', 'pray'],
	eye: ['eye', 'eyes', 'eyeglasses'],
	eyes: ['eyes', 'eye', 'eyeglasses'],
	face: ['smiley', 'grinning', 'neutral_face', 'face_with_raised_eyebrow'],
	nose: ['nose', 'sneezing_face'],
	ear: ['ear', 'hear_no_evil', 'headphones'],
	mouth: ['lips', 'tongue', 'kiss'],
	tongue: ['tongue', 'stuck_out_tongue', 'yum'],
	brain: ['brain', 'thinking', 'bulb'],
	muscle: ['muscle', 'flexed_biceps', 'person_lifting_weights'],
	strong: ['muscle', 'flexed_biceps', 'person_lifting_weights', 'fist', 'fire'],

	// Gestures
	thumbsup: ['thumbsup', '+1', 'ok_hand'],
	thumbsdown: ['thumbsdown', '-1'],
	clap: ['clap', 'raised_hands', 'tada'],
	wave: ['wave', 'raised_hand', 'hand_splayed'],
	pray: ['pray', 'folded_hands', 'please'],
	fist: ['fist', 'punch', 'raised_fist', 'fist_left', 'fist_right'],
	peace: ['v', 'peace', 'dove'],
	rock: ['metal', 'guitar', 'microphone'],
	point: ['point_up', 'point_down', 'point_left', 'point_right', 'point_up_2', 'index_pointing_up'],
	hug: ['hugging', 'people_hugging', 'heart'],
	kiss: ['kiss', 'kissing', 'kissing_heart', 'kissing_closed_eyes', 'kissing_smiling_eyes'],

	// ==================== SYMBOLS & MISC ====================

	// Common Symbols
	check: ['white_check_mark', 'heavy_check_mark', 'ballot_box_with_check', 'ok'],
	cross: ['x', 'negative_squared_cross_mark', 'cross_mark'],
	question: ['question', 'grey_question', 'thinking'],
	exclamation: ['exclamation', 'grey_exclamation', 'bangbang', 'warning'],
	warning: ['warning', 'exclamation', 'bangbang', 'rotating_light'],
	danger: ['warning', 'skull', 'radioactive', 'biohazard', 'no_entry'],
	arrow: ['arrow_right', 'arrow_left', 'arrow_up', 'arrow_down', 'arrow_forward'],
	plus: ['heavy_plus_sign', 'white_check_mark'],
	minus: ['heavy_minus_sign', 'x'],

	// Colors
	red: ['red_circle', 'heart', 'apple', 'tomato', 'strawberry', 'rose'],
	blue: ['blue_circle', 'blue_heart', 'ocean', 'water_wave', 'droplet'],
	green: ['green_circle', 'green_heart', 'green_apple', 'cucumber', 'broccoli', 'shamrock'],
	yellow: ['yellow_circle', 'yellow_heart', 'star', 'sunny', 'banana', 'lemon'],

	purple: ['purple_circle', 'purple_heart', 'grapes', 'eggplant'],
	pink: ['pink_heart', 'cherry_blossom', 'hibiscus', 'pig'],
	black: ['black_circle', 'black_heart', 'new_moon', 'spades'],
	white: ['white_circle', 'white_heart', 'cloud', 'snowflake'],

	// Numbers
	one: ['one', 'first_place', '1st_place_medal'],
	two: ['two', 'second_place', 'v'],
	three: ['three', 'third_place'],
	four: ['four', 'four_leaf_clover'],
	five: ['five', 'hand_splayed'],
	ten: ['keycap_ten', '100', 'raised_hands'],
	hundred: ['100', 'trophy', 'fire'],
	zero: ['zero', 'o2'],

	// Misc
	fire: ['fire', 'flame', 'hot', 'boom', 'collision'],

	new: ['new', 'sparkles', 'star2', 'tada'],
	free: ['free', 'gift', 'tada'],
	soon: ['soon', 'hourglass', 'timer'],
	top: ['top', 'up', 'arrow_up', 'first_place', 'trophy'],
	up: ['up', 'arrow_up', 'top', 'thumbsup'],

	info: ['information_source', 'question', 'bulb'],
	help: ['sos', 'question', 'raised_hand', 'pray'],
	emergency: ['sos', 'ambulance', 'rotating_light', 'police_car', 'fire_engine'],
	magic: ['sparkles', 'crystal_ball', 'magic_wand', 'star2', 'dizzy'],
	luck: ['four_leaf_clover', 'horseshoe', 'star2', 'sparkles', 'rainbow'],
	lucky: ['four_leaf_clover', 'horseshoe', 'star2', 'clover'],
};

/**
 * Search for emojis by keyword
 * Returns a Set of emoji shortcodes that match the search term
 */
export const searchEmojisByKeyword = (searchTerm: string): Set<string> => {
	const searchTermLower = searchTerm.toLowerCase().trim();
	const matches = new Set<string>();

	if (searchTermLower.length < 2) {
		return matches;
	}

	for (const [keyword, emojiList] of Object.entries(emojiKeywords)) {
		// Match if keyword starts with search term or search term starts with keyword
		if (keyword.startsWith(searchTermLower) || searchTermLower.startsWith(keyword)) {
			emojiList.forEach((emoji) => matches.add(emoji));
		}
	}

	return matches;
};
