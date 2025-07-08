-- YouTalk Sample Data
-- File chứa 60 dữ liệu mẫu cho mỗi bảng
-- Tập trung vào sản phẩm (không có dịch vụ), diễn đàn thì có cả dịch vụ và sản phẩm

USE youtalk_db;

-- ========================================
-- SAMPLE DATA FOR USERS TABLE (60 records)
-- ========================================
INSERT INTO users (username, full_name, email, password, profile_picture, bio, role, status) VALUES
('admin1', 'Nguyễn Văn Admin', 'admin@youtalk.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Quản trị viên hệ thống YouTalk', 'admin', 'active'),
('techguru2024', 'Trần Minh Tech', 'techguru@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Chuyên gia công nghệ, đam mê các sản phẩm điện tử mới nhất', 'user', 'active'),
('fashionista_hcm', 'Lê Thu Hương', 'huong.fashion@yahoo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Chuyên gia thời trang, reviewer các sản phẩm làm đẹp', 'user', 'active'),
('gaming_beast', 'Phạm Đức Gamer', 'gamer.beast@outlook.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Game thủ chuyên nghiệp, đánh giá gear gaming', 'user', 'active'),
('beauty_blogger', 'Ngô Thanh Linh', 'linh.beauty@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Beauty blogger nổi tiếng với 100k followers', 'user', 'active'),
('mobile_expert', 'Hoàng Anh Mobile', 'mobilexpert@tech.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Chuyên gia điện thoại di động và phụ kiện', 'user', 'active'),
('laptop_reviewer', 'Vũ Minh Laptop', 'laptop.review@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Reviewer laptop chuyên nghiệp 5 năm kinh nghiệm', 'user', 'active'),
('fitness_lover', 'Đặng Thị Fit', 'fitness.lover@health.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'HLV thể hình, chuyên về thiết bị tập luyện', 'user', 'active'),
('foodie_saigon', 'Bùi Văn Food', 'foodie.sg@food.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Food blogger Sài Gòn, đánh giá đồ gia dụng nhà bếp', 'user', 'active'),
('watch_collector', 'Lý Hoàng Watch', 'watch.collector@luxury.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Collector đồng hồ 10 năm, chuyên gia smartwatch', 'user', 'active'),
('camera_pro', 'Tô Minh Photo', 'camera.pro@photo.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Nhiếp ảnh gia chuyên nghiệp, review máy ảnh', 'user', 'active'),
('home_deco', 'Phan Thu Home', 'home.deco@interior.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Chuyên gia nội thất, đồ trang trí nhà cửa', 'user', 'active'),
('car_enthusiast', 'Đinh Văn Car', 'car.lover@auto.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Đam mê ô tô và phụ kiện xe hơi', 'user', 'active'),
('book_worm', 'Mai Thị Book', 'bookworm@reading.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Mê sách, chuyên review sách và văn phòng phẩm', 'user', 'active'),
('music_lover', 'Cao Anh Music', 'music.lover@sound.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Audiophile, chuyên gia âm thanh và tai nghe', 'user', 'active'),
('travel_blogger', 'Lâm Thu Travel', 'travel.blog@journey.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Travel blogger, review đồ du lịch', 'user', 'active'),
('sports_fan', 'Nguyễn Thể Sport', 'sports.fan@athlete.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'VĐV bán chuyên, chuyên về dụng cụ thể thao', 'user', 'active'),
('gadget_geek', 'Trịnh Minh Gadget', 'gadget.geek@tech.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Geek công nghệ, thích các gadget độc đáo', 'user', 'active'),
('skincare_expert', 'Đỗ Lan Skin', 'skincare@beauty.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Chuyên gia chăm sóc da, dermatologist', 'user', 'active'),
('pet_lover', 'Huỳnh Văn Pet', 'pet.lover@animal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Yêu động vật, chuyên về đồ dùng thú cưng', 'user', 'active'),
('outdoor_adventurer', 'Võ Thu Outdoor', 'outdoor@adventure.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Phượt thủ chuyên nghiệp, gear outdoor', 'user', 'active'),
('fashion_men', 'Lương Anh Fashion', 'fashion.men@style.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Stylist nam, chuyên thời trang nam giới', 'user', 'active'),
('kitchen_chef', 'Dương Thị Chef', 'kitchen.chef@cook.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Đầu bếp chuyên nghiệp, review dụng cụ nhà bếp', 'user', 'active'),
('art_collector', 'Phùng Minh Art', 'art.collector@creative.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Nghệ sĩ và collector đồ nghệ thuật', 'user', 'active'),
('student_tech', 'Sinh Viên Tech', 'student.tech@uni.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Sinh viên CNTT, thích tìm hiểu công nghệ mới', 'user', 'active'),
('mom_blogger', 'Trần Thị Mom', 'mom.blogger@family.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Mẹ bỉm sữa, review đồ dùng mẹ và bé', 'user', 'active'),
('office_worker', 'Ngô Văn Office', 'office.worker@corp.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Nhân viên văn phòng, chuyên đồ dùng office', 'user', 'active'),
('minimalist_life', 'Hoàng Thị Minimal', 'minimal@simple.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Theo phong cách tối giản, chọn lọc sản phẩm', 'user', 'active'),
('luxury_fan', 'Vương Anh Luxury', 'luxury.fan@premium.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Yêu thích hàng hiệu, luxury items', 'user', 'active'),
('budget_hunter', 'Lê Văn Budget', 'budget.hunter@save.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Săn sale, tìm sản phẩm giá rẻ chất lượng', 'user', 'active'),
('eco_friendly', 'Phan Thu Green', 'eco.friendly@green.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Yêu thiên nhiên, chuyên sản phẩm xanh', 'user', 'active'),
('diy_maker', 'Châu Minh DIY', 'diy.maker@craft.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Thích làm đồ handmade, tự chế tạo', 'user', 'active'),
('vintage_collector', 'Đặng Thị Vintage', 'vintage@retro.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Collector đồ cổ, vintage items', 'user', 'active'),
('health_guru', 'Lý Văn Health', 'health.guru@wellness.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Chuyên gia sức khỏe, thiết bị y tế', 'user', 'active'),
('smart_home', 'Tô Thu Smart', 'smart.home@iot.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Chuyên gia smart home, IoT devices', 'user', 'active'),
('anime_fan', 'Nguyễn Anh Anime', 'anime.fan@otaku.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Otaku chính hiệu, collector figure anime', 'user', 'active'),
('coffee_addict', 'Trịnh Văn Coffee', 'coffee@barista.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Coffee addict, chuyên gia pha chế', 'user', 'active'),
('gardening_mom', 'Huỳnh Thị Garden', 'garden@plant.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Yêu thích làm vườn, trồng cây', 'user', 'active'),
('coding_dev', 'Võ Minh Code', 'coding.dev@programmer.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Developer, gear setup workspace', 'user', 'active'),
('motorcycle_rider', 'Lương Thu Motor', 'motor.rider@bike.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Biker chuyên nghiệp, gear moto', 'user', 'active'),
('yoga_teacher', 'Dương Anh Yoga', 'yoga@meditation.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Giáo viên yoga, thiết bị tập yoga', 'user', 'active'),
('wine_connoisseur', 'Phùng Văn Wine', 'wine@sommelier.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Chuyên gia rượu vang, phụ kiện bar', 'user', 'active'),
('cycling_enthusiast', 'Sinh Thị Cycle', 'cycle@bike.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Đam mê xe đạp, gear cycling', 'user', 'active'),
('nail_artist', 'Trần Anh Nail', 'nail.artist@beauty.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Nail artist chuyên nghiệp', 'user', 'active'),
('fishing_lover', 'Ngô Minh Fish', 'fishing@angler.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Câu thủ chuyên nghiệp, gear câu cá', 'user', 'active'),
('dance_teacher', 'Hoàng Văn Dance', 'dance@studio.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Giáo viên khiêu vũ, trang phục dance', 'user', 'active'),
('board_gamer', 'Vương Thị Board', 'board.game@tabletop.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Chuyên gia board game, collector game', 'user', 'active'),
('drone_pilot', 'Lê Anh Drone', 'drone.pilot@aerial.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Phi công drone chuyên nghiệp', 'user', 'active'),
('makeup_artist', 'Phan Minh Makeup', 'makeup@cosmetic.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Makeup artist, chuyên mỹ phẩm', 'user', 'active'),
('running_coach', 'Châu Văn Run', 'running@marathon.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'HLV chạy bộ, gear running', 'user', 'active'),
('bartender_pro', 'Đặng Thị Bar', 'bartender@cocktail.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Bartender chuyên nghiệp', 'user', 'active'),
('esports_player', 'Lý Thu Esports', 'esports@gaming.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Game thủ esports, gaming gear', 'user', 'active'),
('meditation_guide', 'Tô Anh Zen', 'meditation@mindful.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Hướng dẫn viên thiền định', 'user', 'active'),
('camping_expert', 'Nguyễn Văn Camp', 'camping@outdoor.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Chuyên gia cắm trại, gear outdoor', 'user', 'active'),
('jewelry_designer', 'Trịnh Thị Jewelry', 'jewelry@accessory.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Nhà thiết kế trang sức', 'user', 'active'),
('aquarium_keeper', 'Huỳnh Minh Aqua', 'aquarium@fish.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Chuyên gia nuôi cá cảnh', 'user', 'active'),
('fragrance_expert', 'Võ Thu Perfume', 'perfume@fragrance.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Chuyên gia nước hoa', 'user', 'active'),
('3d_printer', 'Lương Anh 3D', '3d.printer@maker.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Chuyên gia in 3D, maker', 'user', 'active'),
('tea_master', 'Dương Văn Tea', 'tea.master@ceremony.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Chuyên gia trà đạo', 'user', 'active'),
('vr_enthusiast', 'Phùng Thị VR', 'vr@virtual.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Chuyên gia thực tế ảo', 'user', 'active'),
('calligraphy_artist', 'Sinh Anh Calli', 'calligraphy@art.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', null, 'Nghệ sĩ thư pháp', 'user', 'active');

-- ========================================
-- SAMPLE DATA FOR CATEGORIES TABLE (60 records)
-- ========================================
INSERT INTO categories (name, description, parent_id, image, status) VALUES
-- Main categories (parent_id = NULL)
('Điện tử & Công nghệ', 'Các sản phẩm điện tử và công nghệ hiện đại', NULL, 'images/categories/technology.png', 'active'),
('Thời trang & Làm đẹp', 'Quần áo, phụ kiện và sản phẩm làm đẹp', NULL, 'images/categories/fashion.png', 'active'),
('Nhà cửa & Đời sống', 'Đồ gia dụng, nội thất và các sản phẩm gia đình', NULL, 'images/categories/furniture.png', 'active'),
('Thể thao & Giải trí', 'Dụng cụ thể thao và đồ giải trí', NULL, 'images/categories/entertainment.png', 'active'),
('Sách & Văn phòng phẩm', 'Sách vở, dụng cụ học tập và văn phòng', NULL, 'images/categories/education.png', 'active'),
('Sức khỏe & Chăm sóc', 'Sản phẩm chăm sóc sức khỏe và làm đẹp', NULL, 'images/categories/health.png', 'active'),
('Ô tô & Xe máy', 'Phụ kiện và đồ dùng cho xe cộ', NULL, 'images/categories/default.png', 'active'),
('Thú cưng & Động vật', 'Đồ dùng và thức ăn cho thú cưng', NULL, 'images/categories/default.png', 'active'),
('Du lịch & Phượt', 'Đồ dùng du lịch và outdoor', NULL, 'images/categories/travel.png', 'active'),
('Đồ chơi & Mẹ bé', 'Đồ chơi trẻ em và sản phẩm mẹ bé', NULL, 'images/categories/default.png', 'active'),

-- Subcategories for Điện tử & Công nghệ (parent_id = 1)
('Điện thoại di động', 'Smartphone và phụ kiện', 1, 'images/categories/phones.png', 'active'),
('Laptop & Máy tính', 'Laptop, PC và linh kiện máy tính', 1, 'images/categories/laptops.png', 'active'),
('Máy ảnh & Quay phim', 'Camera, máy quay và phụ kiện', 1, 'images/categories/default.png', 'active'),
('Tai nghe & Loa', 'Thiết bị âm thanh chất lượng cao', 1, 'images/categories/default.png', 'active'),
('Đồng hồ thông minh', 'Smartwatch và fitness tracker', 1, 'images/categories/default.png', 'active'),
('Gaming & Esports', 'Thiết bị gaming chuyên nghiệp', 1, 'images/categories/default.png', 'active'),
('Smart Home & IoT', 'Thiết bị nhà thông minh', 1, 'images/categories/default.png', 'active'),
('Drone & Flycam', 'Máy bay không người lái', 1, 'images/categories/default.png', 'active'),
('VR & AR', 'Thiết bị thực tế ảo và tăng cường', 1, 'images/categories/default.png', 'active'),
('Phụ kiện điện tử', 'Sạc, cáp, ốp lưng và phụ kiện khác', 1, 'images/categories/default.png', 'active'),

-- Subcategories for Thời trang & Làm đẹp (parent_id = 2)
('Quần áo nam', 'Thời trang nam các loại', 2, 'images/categories/fashion.png', 'active'),
('Quần áo nữ', 'Thời trang nữ đa dạng', 2, 'images/categories/fashion.png', 'active'),
('Giày dép', 'Giày thể thao, cao gót, sandal', 2, 'images/categories/default.png', 'active'),
('Túi xách & Ví', 'Túi xách, balo, ví da', 2, 'images/categories/default.png', 'active'),
('Mỹ phẩm', 'Son, phấn, kem dưỡng da', 2, 'images/categories/beauty.png', 'active'),
('Chăm sóc da', 'Serum, toner, kem chống nắng', 2, 'images/categories/beauty.png', 'active'),
('Nước hoa', 'Nước hoa nam, nữ, unisex', 2, 'images/categories/default.png', 'active'),
('Trang sức', 'Nhẫn, dây chuyền, bông tai', 2, 'images/categories/default.png', 'active'),
('Đồng hồ thời trang', 'Đồng hồ nam nữ thời trang', 2, 'images/categories/default.png', 'active'),
('Phụ kiện thời trang', 'Kính mát, thắt lưng, mũ nón', 2, 'images/categories/default.png', 'active'),

-- Subcategories for Nhà cửa & Đời sống (parent_id = 3)
('Nội thất', 'Bàn ghế, tủ kệ, giường nệm', 3, 'images/categories/furniture.png', 'active'),
('Đồ gia dụng nhà bếp', 'Nồi niêu, dao thớt, máy xay', 3, 'images/categories/default.png', 'active'),
('Thiết bị điện gia dụng', 'Tủ lạnh, máy giặt, lò vi sóng', 3, 'images/categories/default.png', 'active'),
('Trang trí nhà cửa', 'Tranh ảnh, đèn trang trí, cây cảnh', 3, 'images/categories/default.png', 'active'),
('Dụng cụ sửa chữa', 'Máy khoan, búa, tua vít', 3, 'images/categories/default.png', 'active'),
('Vệ sinh nhà cửa', 'Chổi lau, nước tẩy, máy hút bụi', 3, 'images/categories/default.png', 'active'),
('Cây cảnh & Làm vườn', 'Cây trồng, chậu, phân bón', 3, 'images/categories/default.png', 'active'),
('Đồ dùng phòng tắm', 'Bồn rửa, sen vòi, gương', 3, 'images/categories/default.png', 'active'),
('Đồ dùng phòng ngủ', 'Ga giường, gối, màn cửa', 3, 'images/categories/default.png', 'active'),
('An ninh gia đình', 'Camera an ninh, khóa cửa thông minh', 3, 'images/categories/default.png', 'active'),

-- Subcategories for Thể thao & Giải trí (parent_id = 4)
('Thể hình & Gym', 'Tạ, máy tập, dụng cụ gym', 4, 'images/categories/default.png', 'active'),
('Chạy bộ & Cardio', 'Giày chạy, máy chạy bộ, đồng hồ thể thao', 4, 'images/categories/default.png', 'active'),
('Bóng đá & Thể thao đồng đội', 'Bóng, giày, quần áo thể thao', 4, 'images/categories/default.png', 'active'),
('Cầu lông & Tennis', 'Vợt, bóng, giày chuyên dụng', 4, 'images/categories/default.png', 'active'),
('Bơi lội & Thể thao nước', 'Kính bơi, áo bơi, phao', 4, 'images/categories/default.png', 'active'),
('Yoga & Thiền', 'Thảm yoga, gạch tập, quần áo yoga', 4, 'images/categories/default.png', 'active'),
('Xe đạp & Cycling', 'Xe đạp thể thao, mũ bảo hiểm, phụ kiện', 4, 'images/categories/default.png', 'active'),
('Board game & Puzzle', 'Cờ vua, puzzle, board game', 4, 'images/categories/default.png', 'active'),
('Câu cá & Outdoor', 'Cần câu, mồi, dụng cụ câu cá', 4, 'images/categories/default.png', 'active'),
('Cắm trại & Phượt', 'Lều, túi ngủ, bếp gas mini', 4, 'images/categories/default.png', 'active'),

-- Subcategories for Sách & Văn phòng phẩm (parent_id = 5)
('Sách giáo khoa', 'Sách học từ mầm non đến đại học', 5, 'images/categories/education.png', 'active'),
('Sách kỹ năng & Kinh doanh', 'Sách phát triển bản thân, kinh doanh', 5, 'images/categories/education.png', 'active'),
('Văn học & Tiểu thuyết', 'Truyện, thơ, văn học trong ngoài nước', 5, 'images/categories/education.png', 'active'),
('Dụng cụ học tập', 'Bút viết, vở, thước kẻ', 5, 'images/categories/education.png', 'active'),
('Thiết bị văn phòng', 'Máy in, máy photo, máy tính để bàn', 5, 'images/categories/education.png', 'active'),
('Nghệ thuật & Sáng tạo', 'Màu vẽ, cọ vẽ, giấy vẽ', 5, 'images/categories/education.png', 'active'),
('Lịch & Sổ tay', 'Sổ ghi chú, lịch để bàn, planner', 5, 'images/categories/education.png', 'active'),
('Đồ dùng học sinh', 'Cặp sách, hộp bút, bình nước', 5, 'images/categories/education.png', 'active'),
('Khóa học online', 'Khóa học lập trình, ngoại ngữ, kỹ năng', 5, 'images/categories/education.png', 'active'),
('Máy tính khoa học', 'Máy tính Casio, Canon cho học sinh', 5, 'images/categories/education.png', 'active');

-- ========================================
-- SAMPLE DATA FOR PRODUCTS TABLE (60 records)
-- ========================================
INSERT INTO products (name, description, price, category_id, creator_id, brand, location, images, specs, is_featured, view_count, status) VALUES
-- Điện tử & Công nghệ
('iPhone 15 Pro Max 256GB', 'Điện thoại iPhone 15 Pro Max mới nhất với chip A17 Pro, camera 48MP và titanium design', 32990000.00, 11, 2, 'Apple', 'Hồ Chí Minh', NULL, 'Chip A17 Pro, RAM 8GB, Camera 48MP, Pin 4441mAh', TRUE, 1250, 'active'),
('Samsung Galaxy S24 Ultra', 'Flagship Samsung với bút S Pen, camera 200MP và AI tích hợp', 30990000.00, 11, 6, 'Samsung', 'Hà Nội', NULL, 'Snapdragon 8 Gen 3, RAM 12GB, Camera 200MP, Pin 5000mAh', TRUE, 980, 'active'),
('MacBook Pro M3 14 inch', 'Laptop MacBook Pro với chip M3 mạnh mẽ cho công việc chuyên nghiệp', 52990000.00, 12, 7, 'Apple', 'Đà Nẵng', NULL, 'Chip M3, RAM 16GB, SSD 512GB, Màn hình 14.2 inch Liquid Retina XDR', TRUE, 750, 'active'),
('Dell XPS 13 Plus', 'Laptop ultrabook cao cấp với thiết kế hiện đại và hiệu năng mạnh', 38990000.00, 12, 39, 'Dell', 'Hồ Chí Minh', NULL, 'Intel Core i7-1360P, RAM 16GB, SSD 1TB, Màn hình 13.4 inch 3.5K', FALSE, 420, 'active'),
('Sony A7R V', 'Máy ảnh mirrorless full-frame 61MP với khả năng quay 8K', 89990000.00, 13, 11, 'Sony', 'Hà Nội', NULL, 'Sensor 61MP, ISO 100-32000, Quay 8K 24fps, 5-axis stabilization', TRUE, 315, 'active'),
('Canon EOS R6 Mark II', 'Máy ảnh mirrorless với sensor 24MP và tốc độ chụp liên tiếp 12fps', 62990000.00, 13, 11, 'Canon', 'Hồ Chí Minh', NULL, 'Sensor 24MP, ISO 100-102400, Quay 4K 60fps, Dual Pixel CMOS AF II', FALSE, 280, 'active'),
('AirPods Pro 2', 'Tai nghe true wireless với noise cancellation và Spatial Audio', 6490000.00, 14, 15, 'Apple', 'Hà Nội', NULL, 'Chip H2, Active Noise Cancellation, Spatial Audio, Pin 30 giờ', TRUE, 890, 'active'),
('Sony WH-1000XM5', 'Tai nghe over-ear với noise cancellation hàng đầu thế giới', 8990000.00, 14, 15, 'Sony', 'Đà Nẵng', NULL, 'Noise Cancellation V1, LDAC, Pin 30 giờ, Multipoint connection', FALSE, 567, 'active'),
('Apple Watch Series 9', 'Smartwatch với chip S9 và tính năng Double Tap mới', 10990000.00, 15, 10, 'Apple', 'Hồ Chí Minh', NULL, 'Chip S9, Always-On Display, GPS + Cellular, Chống nước 50m', TRUE, 623, 'active'),
('Samsung Galaxy Watch 6', 'Smartwatch với theo dõi sức khỏe toàn diện và pin 40 giờ', 7490000.00, 15, 10, 'Samsung', 'Hà Nội', NULL, 'Exynos W930, Wear OS 4, BioActive Sensor, Pin 40 giờ', FALSE, 445, 'active'),

-- Gaming & Esports
('Razer DeathAdder V3 Pro', 'Chuột gaming wireless với sensor Focus Pro 30K', 3990000.00, 16, 4, 'Razer', 'Hồ Chí Minh', NULL, 'Sensor Focus Pro 30K, Switch Optical Gen-3, Pin 90 giờ', FALSE, 234, 'active'),
('Logitech G Pro X Superlight', 'Chuột gaming siêu nhẹ 63g cho esports chuyên nghiệp', 3590000.00, 16, 50, 'Logitech', 'Hà Nội', NULL, 'Sensor HERO 25K, Trọng lượng 63g, Pin 70 giờ, Zero latency', FALSE, 189, 'active'),
('SteelSeries Apex Pro TKL', 'Bàn phím cơ gaming với OmniPoint switches có thể điều chỉnh', 5490000.00, 16, 4, 'SteelSeries', 'Đà Nẵng', NULL, 'OmniPoint 2.0 Switches, OLED Display, RGB Per-key, Tenkeyless', FALSE, 167, 'active'),
('ASUS ROG Swift PG32UQX', 'Màn hình gaming 32 inch 4K 144Hz với Mini LED', 42990000.00, 16, 4, 'ASUS', 'Hồ Chí Minh', NULL, '32 inch 4K, 144Hz, Mini LED, G-Sync Ultimate, HDR1400', TRUE, 98, 'active'),

-- Smart Home & IoT
('Xiaomi Robot Vacuum S10+', 'Robot hút bụi với station tự làm sạch và AI navigation', 12990000.00, 17, 35, 'Xiaomi', 'Hà Nội', NULL, 'LiDAR Navigation, Auto-empty station, 4000Pa suction, App control', FALSE, 156, 'active'),
('Philips Hue Starter Kit', 'Bộ đèn thông minh RGB với điều khiển qua app', 4990000.00, 17, 35, 'Philips', 'Hồ Chí Minh', NULL, '16 triệu màu, Dimming, Voice control, Zigbee 3.0', FALSE, 234, 'active'),

-- Thời trang & Làm đẹp
('Áo sơ mi Oxford nam', 'Áo sơ mi Oxford cao cấp với chất liệu cotton 100%', 890000.00, 21, 22, 'The Shirt Studio', 'Hồ Chí Minh', NULL, 'Cotton 100%, Regular fit, Màu trắng/xanh, Size S-XXL', FALSE, 345, 'active'),
('Quần jean skinny nữ', 'Quần jean nữ form skinny với chất liệu co giãn thoải mái', 1290000.00, 22, 3, 'Levi\'s', 'Hà Nội', NULL, 'Cotton blend, Skinny fit, High waist, Màu xanh đậm', FALSE, 289, 'active'),
('Giày sneaker Air Force 1', 'Giày thể thao classic Nike Air Force 1 màu trắng', 2890000.00, 23, 22, 'Nike', 'Hồ Chí Minh', NULL, 'Da synthetic, Air cushioning, Rubber sole, Màu trắng', TRUE, 567, 'active'),
('Túi xách tote da thật', 'Túi xách tote size lớn làm từ da bò thật 100%', 3490000.00, 24, 3, 'Charles & Keith', 'Hà Nội', NULL, 'Da bò thật, Kích thước 35x30x15cm, Màu đen/nâu', FALSE, 198, 'active'),
('Son môi matte liquid', 'Son lì lâu trôi với công thức không khô môi', 650000.00, 25, 5, 'MAC Cosmetics', 'Hồ Chí Minh', NULL, 'Matte finish, Lâu trôi 8h, Không khô môi, 12 màu', FALSE, 456, 'active'),
('Serum Vitamin C 20%', 'Serum vitamin C cô đặc giúp sáng da và chống lão hóa', 1890000.00, 26, 19, 'The Ordinary', 'Hà Nội', NULL, 'Vitamin C 20%, Vitamin E, Hyaluronic acid, 30ml', TRUE, 723, 'active'),
('Nước hoa nam Bleu de Chanel', 'Nước hoa nam sang trọng với hương thơm gỗ và citrus', 3890000.00, 27, 55, 'Chanel', 'Hồ Chí Minh', NULL, 'EDT 100ml, Hương gỗ-citrus, Lưu hương 6-8h', TRUE, 234, 'active'),
('Nhẫn bạc 925 đính đá', 'Nhẫn bạc cao cấp đính đá CZ lấp lánh', 1290000.00, 28, 54, 'Pandora', 'Hà Nội', NULL, 'Bạc 925, Đá CZ, Thiết kế tinh tế, Size 5-9', FALSE, 167, 'active'),

-- Nhà cửa & Đời sống
('Bàn làm việc gỗ sồi', 'Bàn làm việc hiện đại bằng gỗ sồi tự nhiên', 4890000.00, 31, 12, 'IKEA', 'Hồ Chí Minh', NULL, 'Gỗ sồi tự nhiên, 120x60x75cm, Có ngăn kéo', FALSE, 189, 'active'),
('Nồi cơm điện Zojirushi', 'Nồi cơm điện cao cấp với công nghệ IH và lót kim cương', 8990000.00, 32, 23, 'Zojirushi', 'Hà Nội', NULL, 'Công nghệ IH, Lót kim cương, 10 cups, 20 chế độ nấu', TRUE, 234, 'active'),
('Máy giặt LG Inverter', 'Máy giặt cửa trước 9kg với công nghệ AI DD và inverter', 15990000.00, 33, 12, 'LG', 'Đà Nẵng', NULL, '9kg, AI DD Technology, Inverter Direct Drive, 14 chương trình', TRUE, 156, 'active'),
('Đèn trang trí LED Philips', 'Đèn LED thông minh điều chỉnh màu sắc và độ sáng', 2890000.00, 34, 12, 'Philips', 'Hồ Chí Minh', NULL, 'LED 20W, 16 triệu màu, Điều khiển app, Tuổi thọ 25000h', FALSE, 198, 'active'),
('Máy khoan Bosch Professional', 'Máy khoan búa chuyên nghiệp với motor mạnh mẽ', 3590000.00, 35, 32, 'Bosch', 'Hà Nội', NULL, 'Motor 850W, Chuck 13mm, 3 chế độ, Kèm bộ mũi khoan', FALSE, 123, 'active'),

-- Thể thao & Giải trí
('Tạ đôi cao su 20kg', 'Bộ tạ đôi bọc cao su chống trượt cho tập gym tại nhà', 1890000.00, 41, 8, 'Adidas', 'Hồ Chí Minh', NULL, 'Cao su chống trượt, 2 thanh x 10kg, Grip ergonomic', FALSE, 167, 'active'),
('Giày chạy bộ Ultraboost', 'Giày chạy bộ với đệm Boost và upper Primeknit', 4890000.00, 42, 49, 'Adidas', 'Hà Nội', NULL, 'Boost midsole, Primeknit upper, Continental rubber, Màu đen', TRUE, 345, 'active'),
('Bóng đá FIFA World Cup', 'Bóng đá chính thức FIFA World Cup 2022 chất liệu da PU', 890000.00, 43, 17, 'Adidas', 'Đà Nẵng', NULL, 'Size 5, Da PU, FIFA approved, Thiết kế Al Rihla', FALSE, 234, 'active'),
('Vợt cầu lông Yonex', 'Vợt cầu lông carbon với balance head heavy cho smash mạnh', 2890000.00, 44, 17, 'Yonex', 'Hồ Chí Minh', NULL, 'Khung carbon, Trọng lượng 88g, Balance head heavy, Tension 30lbs', FALSE, 156, 'active'),
('Thảm yoga TPE cao cấp', 'Thảm yoga thân thiện môi trường với độ bám cao', 890000.00, 46, 40, 'Manduka', 'Hà Nội', NULL, 'Chất liệu TPE, 6mm, 183x61cm, Chống trượt, Nhiều màu', FALSE, 289, 'active'),
('Xe đạp thể thao Giant', 'Xe đạp đường trường với khung carbon và group set Shimano', 32990000.00, 47, 43, 'Giant', 'Hồ Chí Minh', NULL, 'Khung carbon, Shimano 105, 22 speed, Wheel 700c', TRUE, 98, 'active'),

-- Sách & Văn phòng phẩm
('Atomic Habits - Thay đổi tí hon', 'Sách phát triển bản thân về việc xây dựng thói quen tốt', 189000.00, 52, 14, 'First News', 'Hà Nội', NULL, '320 trang, Bìa mềm, Tác giả James Clear, Ngôn ngữ tiếng Việt', TRUE, 567, 'active'),
('Sách giáo khoa Toán lớp 12', 'Sách giáo khoa môn Toán lớp 12 theo chương trình mới', 89000.00, 51, 14, 'NXB Giáo dục', 'Hà Nội', NULL, '280 trang, Chương trình 2018, Có bài tập và đáp án', FALSE, 234, 'active'),
('Bút gel Pilot G2', 'Bút gel mượt mà với mực không lem và thiết kế ergonomic', 45000.00, 54, 27, 'Pilot', 'Hồ Chí Minh', NULL, 'Mực gel, Đầu 0.7mm, Không lem, Nhiều màu, Thân grip', FALSE, 456, 'active'),
('Máy in Canon Pixma', 'Máy in phun màu đa năng cho gia đình và văn phòng nhỏ', 3290000.00, 55, 27, 'Canon', 'Đà Nẵng', NULL, 'In/Copy/Scan, Wifi, 4800x1200 dpi, Cartridge đơn lẻ', FALSE, 178, 'active'),

-- Sức khỏe & Chăm sóc
('Máy đo huyết áp Omron', 'Máy đo huyết áp điện tử tự động với độ chính xác cao', 1890000.00, 6, 34, 'Omron', 'Hà Nội', NULL, 'Màn hình LCD, Bộ nhớ 90 lần đo, Phát hiện loạn nhịp tim', TRUE, 234, 'active'),
('Máy massage cầm tay', 'Máy massage gun với 4 đầu massage và 5 tốc độ', 2890000.00, 6, 8, 'Theragun', 'Hồ Chí Minh', NULL, '5 tốc độ, 4 đầu massage, Pin 150 phút, Ít ồn 40dB', FALSE, 167, 'active'),
('Thực phẩm bảo vệ sức khỏe Omega-3', 'Viên uống Omega-3 từ dầu cá hỗ trợ tim mạch và não bộ', 890000.00, 6, 34, 'Nature Made', 'Hà Nội', NULL, '1000mg EPA+DHA, 100 viên, Không mùi tanh, USP verified', FALSE, 345, 'active'),

-- Thú cưng & Động vật
('Thức ăn cho chó Royal Canin', 'Thức ăn khô cao cấp cho chó trưởng thành với dinh dưỡng cân bằng', 890000.00, 8, 20, 'Royal Canin', 'Hồ Chí Minh', NULL, '15kg, Adult, Protein 26%, Vitamin & khoáng chất', FALSE, 289, 'active'),
('Lồng hamster 3 tầng', 'Lồng nuôi hamster rộng rãi với đầy đủ phụ kiện', 1290000.00, 8, 20, 'Ferplast', 'Hà Nội', NULL, '3 tầng, Kích thước 60x40x60cm, Có cầu thang và bánh xe', FALSE, 156, 'active'),

-- Du lịch & Phượt
('Balo du lịch Osprey 65L', 'Balo trekking chuyên nghiệp với hệ thống lưng thông thoáng', 8990000.00, 9, 21, 'Osprey', 'Hồ Chí Minh', NULL, '65L, Anti-Gravity suspension, Raincover, Lifetime warranty', TRUE, 134, 'active'),
('Lều 2 người Coleman', 'Lều cắm trại chống nước với thiết kế dome dễ dựng', 3490000.00, 9, 52, 'Coleman', 'Đà Nẵng', NULL, '2 người, Chống nước 3000mm, Setup 10 phút, Kích thước 2.1x1.4m', FALSE, 167, 'active'),

-- Đồ chơi & Mẹ bé
('Xe đẩy em bé Bugaboo', 'Xe đẩy cao cấp với khung nhôm nhẹ và bánh xe all-terrain', 18990000.00, 10, 26, 'Bugaboo', 'Hà Nội', NULL, 'Từ 0-4 tuổi, Khung nhôm, Gấp gọn, All-terrain wheels', TRUE, 89, 'active'),
('Bộ đồ chơi LEGO Creator', 'Bộ xếp hình LEGO 3 trong 1 phát triển tư duy sáng tạo', 2890000.00, 10, 26, 'LEGO', 'Hồ Chí Minh', NULL, '1210 mảnh, 3 mô hình, Tuổi 9+, Creator Expert series', FALSE, 178, 'active'),

-- Ô tô & Xe máy  
('Lốp xe Michelin Pilot Sport', 'Lốp xe thể thao cao su cao cấp cho sedan và coupe', 4890000.00, 7, 13, 'Michelin', 'Hồ Chí Minh', NULL, 'Size 225/45R17, Compound sport, Wet grip A, Fuel efficiency B', FALSE, 123, 'active'),
('Dầu nhớt Castrol GTX', 'Dầu động cơ bán tổng hợp bảo vệ khỏi cặn bẩn', 890000.00, 7, 13, 'Castrol', 'Hà Nội', NULL, '4L, 10W-40, Semi-synthetic, API SN, Bảo vệ 10000km', FALSE, 234, 'active'),

-- Các sản phẩm bổ sung để đủ 60
('Cáp sạc USB-C to Lightning', 'Cáp sạc nhanh chính hãng Apple cho iPhone', 890000.00, 20, 2, 'Apple', 'Hồ Chí Minh', NULL, 'Dài 1m, USB-C to Lightning, Fast charging, MFi certified', FALSE, 567, 'active'),
('Ốp lưng iPhone silicone', 'Ốp lưng silicone mềm mại bảo vệ toàn diện', 590000.00, 20, 6, 'Apple', 'Hà Nội', NULL, 'Silicone cao cấp, Bảo vệ camera, Wireless charging, Nhiều màu', FALSE, 789, 'active'),
('Chuột wireless Logitech MX', 'Chuột không dây cao cấp cho productivity', 2290000.00, 20, 39, 'Logitech', 'Đà Nẵng', NULL, 'Sensor Darkfield, 7 nút, Pin 70 ngày, Multi-device', FALSE, 234, 'active'),
('Bàn phím cơ Keychron K2', 'Bàn phím cơ compact với switch hot-swappable', 2890000.00, 20, 39, 'Keychron', 'Hồ Chí Minh', NULL, '75% layout, Hot-swappable, RGB, Wireless + USB-C', FALSE, 198, 'active');

-- ========================================
-- SAMPLE DATA FOR POSTS TABLE (60 records)
-- ========================================
INSERT INTO posts (title, content, user_id, category_id, post_type, product_id, media, tags, view_count, status) VALUES
-- Technology Discussion Posts
('Review chi tiết iPhone 15 Pro Max - Có đáng để nâng cấp?', 'Sau 2 tuần sử dụng iPhone 15 Pro Max, mình muốn chia sẻ những trải nghiệm thực tế. Camera 48MP thực sự ấn tượng với khả năng zoom 5x, màn hình 120Hz mượt mà. Tuy nhiên giá thành khá cao so với các đối thủ Android. Pin kéo dài cả ngày sử dụng nặng. Thiết kế titanium sang trọng nhưng dễ bám vân tay. Nhìn chung là một chiếc điện thoại tuyệt vời nhưng cần cân nhắc về giá.', 2, 11, 'review', 1, NULL, 'iPhone,Apple,smartphone,review,camera', 1250, 'active'),
('MacBook Pro M3 vs Dell XPS 13 - So sánh laptop cho lập trình viên', 'Là một developer, mình đã test cả 2 chiếc laptop này trong 1 tháng. MacBook Pro M3 vượt trội về hiệu năng và pin, compiler code nhanh hơn 40%. Tuy nhiên Dell XPS 13 linh hoạt hơn với Windows và giá cả hợp lý hơn. MacBook thích hợp cho iOS dev, còn Dell tốt cho web development và game dev.', 39, 12, 'discussion', 3, NULL, 'laptop,MacBook,Dell,programming,developer', 890, 'active'),
('Tư vấn chọn máy ảnh mirrorless cho người mới', 'Các bạn newbie muốn mua máy ảnh mirrorless nên chọn gì? Budget khoảng 20-30 triệu. Mình đang phân vân giữa Sony A7 IV và Canon R6 Mark II. Chủ yếu chụp portrait và landscape. Ai có kinh nghiệm thì tư vấn giúp mình với!', 11, 13, 'question', NULL, NULL, 'camera,mirrorless,Sony,Canon,photography', 567, 'active'),
('AirPods Pro 2 - Noise cancelling đỉnh cao hay chỉ là marketing?', 'Đã dùng AirPods Pro 2 được 6 tháng, noise cancelling thực sự ấn tượng. Ngồi quán cafe ồn ào mà vẫn nghe nhạc rõ ràng. Spatial Audio trên Apple Music hay Netflix rất immersive. Pin kéo dài cả ngày. Tuy nhiên giá hơi đắt so với tai nghe Android. Nhưng nếu dùng iPhone thì đây là lựa chọn tốt nhất.', 15, 14, 'review', 7, NULL, 'AirPods,Apple,wireless,noise cancelling', 723, 'active'),
('Apple Watch Series 9 có gì mới so với Series 8?', 'Vừa lên đời từ Series 8 lên Series 9. Chip S9 nhanh hơn rõ rệt, đặc biệt khi dùng Siri. Tính năng Double Tap khá tiện khi tay bận. Màn hình sáng hơn 2000 nits. Tuy nhiên pin vẫn chỉ kéo dài 1 ngày. Design không thay đổi. Nếu đang dùng Series 8 thì chưa cần thiết phải nâng cấp.', 10, 15, 'review', 9, NULL, 'Apple Watch,smartwatch,wearable,fitness', 445, 'active'),

-- Gaming Posts
('Setup gaming 2024 - Chia sẻ bàn setup dream của mình', 'Sau 2 năm tích cóp cuối cùng cũng hoàn thiện được bàn setup mơ ước. Màn hình ASUS ROG 32 inch 4K 144Hz, chuột Razer DeathAdder V3 Pro, bàn phím SteelSeries Apex Pro TKL. PC với RTX 4080 và i7-13700K. Chơi Cyberpunk 2077 max setting 4K được 80-90fps. Chi phí tổng khoảng 120 triệu nhưng xứng đáng!', 4, 16, 'discussion', 11, NULL, 'gaming,setup,PC,RTX4080,monitor', 567, 'active'),
('Chuột gaming nào tốt nhất hiện tại dưới 4 triệu?', 'Đang tìm chuột gaming thay thế con cũ. Budget khoảng 3-4 triệu. Chơi chủ yếu FPS như Valorant và CS2. Đang cân nhắc giữa Razer DeathAdder V3 Pro và Logitech G Pro X Superlight. Ai dùng rồi thì review giúp mình với!', 50, 16, 'question', NULL, NULL, 'gaming mouse,Razer,Logitech,FPS,esports', 234, 'active'),
('Bàn phím cơ cho gaming - Switch nào phù hợp?', 'Mới tìm hiểu về bàn phím cơ. Hiện đang dùng membrane muốn chuyển sang mechanical. Chủ yếu gaming và đôi khi typing. Red switch hay Blue switch phù hợp hơn? Có nên đầu tư hot-swappable không?', 4, 16, 'question', NULL, NULL, 'mechanical keyboard,switches,gaming,typing', 189, 'active'),

-- Smart Home Posts  
('Hành trình biến nhà thành smart home với 20 triệu', 'Chia sẻ quá trình upgrade nhà thành smart home trong 6 tháng với budget 20 triệu. Bắt đầu với Philips Hue cho lighting, thêm Xiaomi Robot Vacuum, camera Xiaomi, khóa thông minh. App Mi Home quản lý tất cả rất tiện. Tiết kiệm điện 30% và an ninh tốt hơn nhiều.', 35, 17, 'discussion', 15, NULL, 'smart home,automation,Philips Hue,Xiaomi,IoT', 445, 'active'),
('Robot hút bụi có thực sự thay thế được việc dọn nhà?', 'Đã dùng Xiaomi Robot Vacuum S10+ được 3 tháng. Thực tế là 80% việc hút bụi được robot lo. Nhà sạch hơn vì robot dọn hàng ngày. Tuy nhiên vẫn phải tự dọn những chỗ robot không vào được. Station tự làm sạch rất tiện. Đầu tư đáng giá cho gia đình bận rộn.', 35, 17, 'review', 15, NULL, 'robot vacuum,smart home,automation,cleaning', 334, 'active'),

-- Fashion & Beauty Posts
('Trend thời trang nam 2024 - Minimalism is the key', 'Xu hướng thời trang nam 2024 thiên về minimalism và sustainability. Áo sơ mi Oxford basic, quần jean straight fit, sneaker trắng sạch. Chất liệu cotton và linen được ưa chuộng. Màu sắc earth tone như beige, olive, navy. Đầu tư vào basic pieces chất lượng tốt sẽ mặc được lâu và versatile.', 22, 21, 'discussion', NULL, NULL, 'fashion,menswear,minimalism,trend 2024,style', 456, 'active'),
('Review chi tiết serum Vitamin C The Ordinary', 'Đã dùng serum Vitamin C 20% của The Ordinary được 2 tháng. Giá rẻ chỉ 1.8 triệu nhưng hiệu quả tốt. Da sáng màu rõ rệt, đốm nâu mờ đi. Tuy nhiên có hơi kích ứng ban đầu, cần dùng từ từ. Texture hơi sticky. Nhìn chung đáng đồng tiền bát gạo cho người mới bắt đầu với Vitamin C.', 19, 26, 'review', 22, NULL, 'skincare,vitamin C,serum,The Ordinary,beauty', 567, 'active'),
('Skincare routine cho da dầu mụn hiệu quả', 'Chia sẻ routine đã giúp mình cải thiện da dầu mụn sau 6 tháng. Sáng: cleanser CeraVe, toner Paula\'s Choice BHA, moisturizer Cetaphil, sunscreen. Tối: double cleansing, tretinoin 2-3 lần/tuần, moisturizer. Quan trọng là kiên trì và gentle với da.', 19, 26, 'discussion', NULL, NULL, 'skincare,acne,oily skin,routine,beauty tips', 445, 'active'),

-- Home & Lifestyle Posts
('Thiết kế phòng làm việc tại nhà với 15 triệu', 'WFH 2 năm nay, cuối cùng đã setup được home office ưng ý. Bàn gỗ sồi IKEA, ghế Herman Miller Aeron (mua second), monitor Dell 27 inch, đèn LED Philips. Tổng chi phí 15 triệu. Productivity tăng rõ rệt, đau lưng giảm hẳn. Đầu tư cho workspace thực sự đáng giá.', 12, 31, 'discussion', 25, NULL, 'home office,workspace,furniture,productivity,WFH', 334, 'active'),
('Nồi cơm điện Zojirushi có đáng giá 9 triệu?', 'Vợ mình mua nồi cơm Zojirushi 9 triệu, ban đầu thấy đắt quá. Nhưng sau 3 tháng sử dụng phải công nhận cơm thực sự ngon hơn. IH heating đều, cơm dẻo mềm vừa phải. 20 chế độ nấu khác nhau. Keep warm 12 tiếng cơm vẫn ngon. Nếu gia đình ăn cơm nhiều thì đầu tư đáng giá.', 23, 32, 'review', 26, NULL, 'rice cooker,kitchen,appliance,Zojirushi,cooking', 278, 'active'),

-- Sports & Fitness Posts
('Lộ trình tập gym cho người mới bắt đầu', 'Chia sẻ lộ trình tập gym hiệu quả cho newbie. Tuần 1-4: làm quen với máy móc, full body 3 sessions/tuần. Tuần 5-8: tăng cường độ, split upper/lower. Dinh dưỡng quan trọng không kém, protein 1.6g/kg cân nặng. Nghỉ ngơi đầy đủ để cơ phục hồi. Kiên trì là chìa khóa thành công.', 8, 41, 'discussion', NULL, NULL, 'fitness,gym,workout,beginner,health', 445, 'active'),
('Review giày chạy bộ Adidas Ultraboost 22', 'Đã chạy 500km với đôi Ultraboost 22. Đệm Boost thực sự êm ái, phù hợp chạy long run. Upper Primeknit ôm chân thoải mái. Tuy nhiên sole hơi mềm, không phù hợp speed work. Giá 4.8 triệu hơi cao nhưng chất lượng tương xứng. Recommend cho runner thích comfort hơn performance.', 49, 42, 'review', 30, NULL, 'running,shoes,Adidas,Ultraboost,marathon', 389, 'active'),
('Thảm yoga nào tốt cho người mới tập?', 'Mới bắt đầu tập yoga tại nhà, đang tìm thảm phù hợp. Budget khoảng 500k-1 triệu. Có nên mua TPE hay PVC? Độ dày bao nhiêu là tốt? Ai có kinh nghiệm thì tư vấn giúp mình với. Cảm ơn cả nhà!', 40, 46, 'question', NULL, NULL, 'yoga,mat,beginner,fitness,equipment', 234, 'active'),

-- Books & Education Posts
('Review sách "Atomic Habits" - Cuốn sách thay đổi cuộc đời', 'Vừa đọc xong Atomic Habits của James Clear. Cuốn sách thực sự practical về việc xây dựng thói quen tốt. Concept về 1% better everyday rất thuyết phục. Cung cấp framework cụ thể để implement. Đã áp dụng được vài kỹ thuật và thấy hiệu quả. Recommend cho ai muốn cải thiện bản thân.', 14, 52, 'review', 35, NULL, 'books,self-help,habits,productivity,development', 678, 'active'),
('Chia sẻ cách học lập trình hiệu quả cho người tự học', 'Tự học code 2 năm và hiện đã có job dev. Chia sẻ roadmap: Bắt đầu với HTML/CSS/JS, làm project nhỏ, học React/Node.js, build portfolio, apply job. Quan trọng là practice thường xuyên và tham gia community. Coursera và Udemy có khóa hay. Đừng học quá nhiều ngôn ngữ cùng lúc.', 25, 59, 'discussion', NULL, NULL, 'programming,learning,self-taught,coding,career', 556, 'active'),

-- Health & Wellness Posts
('Máy đo huyết áp tại nhà - Cần thiết cho người trung niên', 'Bác sĩ khuyên đo huyết áp thường xuyên nên mua máy Omron về nhà. Sử dụng đơn giản, độ chính xác cao so với bệnh viện. Có memory lưu 90 lần đo, theo dõi xu hướng. Phát hiện sớm các bất thường. Giá 1.8 triệu đầu tư đáng giá cho sức khỏe. Recommend cho gia đình có người cao tuổi.', 34, 6, 'review', 51, NULL, 'health,blood pressure,medical device,wellness', 334, 'active'),
('Massage gun có thực sự hiệu quả sau tập luyện?', 'Đã dùng massage gun Theragun 3 tháng sau gym sessions. Thực tế giúp giảm đau nhức cơ rõ rệt, phục hồi nhanh hơn. 4 đầu massage cho các nhóm cơ khác nhau. Pin kéo dài 2.5 tiếng. Hơi ồn nhưng chấp nhận được. Giá 2.8 triệu hơi cao nhưng hiệu quả tốt cho athlete.', 8, 6, 'review', 52, NULL, 'massage,recovery,fitness,muscle,wellness', 267, 'active'),

-- Pets Posts
('Kinh nghiệm nuôi chó Golden Retriever trong chung cư', 'Nuôi Golden trong chung cư 2 năm, chia sẻ kinh nghiệm. Cần không gian ít nhất 60m2, tập thể dục 2 tiếng/ngày. Thức ăn Royal Canin Adult tốt, cần 400g/ngày. Lông rụng nhiều mùa thay lông. Chi phí tháng khoảng 2 triệu (ăn, vệ sinh, y tế). Cần chuẩn bị tâm lý trước khi nuôi.', 20, 8, 'discussion', 55, NULL, 'pets,dogs,Golden Retriever,apartment,pet care', 445, 'active'),

-- Travel Posts
('Checklist đồ dùng trekking Sa Pa đầy đủ nhất', 'Vừa trekking Sa Pa 3 ngày 2 đêm, chia sẻ checklist đồ cần thiết. Balo Osprey 65L, giày hiking, áo chống nước, túi ngủ, đèn pin. Thời tiết thay đổi liên tục cần chuẩn bị kỹ. Lều Coleman 2 người đủ rộng. Bếp gas mini và thức ăn khô. Tổng weight khoảng 15kg cho 3 ngày.', 21, 9, 'discussion', 57, NULL, 'trekking,SaPa,hiking,outdoor,travel gear', 378, 'active'),

-- DIY & Services Posts (bao gồm cả dịch vụ như yêu cầu)
('Dịch vụ sửa chữa laptop tại nhà - Trải nghiệm thực tế', 'Laptop Dell bị lag nặng, gọi dịch vụ sửa tại nhà. Kỹ thuật viên đến đúng giờ, chẩn đoán nhanh là do ổ cứng và RAM. Thay SSD 1TB + thêm RAM 8GB, máy nhanh như mới. Chi phí 4.5 triệu cho linh kiện + công. Service tốt, bảo hành 6 tháng. Recommend cho ai bận không đem ra tiệm.', 27, 12, 'review', NULL, NULL, 'laptop repair,service,home service,Dell,computer', 234, 'active'),
('Dịch vụ vệ sinh máy lạnh có cần thiết không?', 'Máy lạnh nhà mình dùng 2 năm chưa vệ sinh lần nào. Gọi dịch vụ về làm, giá 300k/cục. Họ tháo rửa dàn lạnh, thay gas, kiểm tra hệ thống. Sau đó máy lạnh lạnh hơn, tiết kiệm điện hơn. Nên vệ sinh 6 tháng/lần để đảm bảo hiệu quả và tuổi thọ máy.', 12, 33, 'discussion', NULL, NULL, 'air conditioner,cleaning service,maintenance,home service', 189, 'active'),
('Kinh nghiệm thuê dịch vụ chuyển nhà trọn gói', 'Vừa chuyển nhà từ quận 1 lên quận 7, thuê dịch vụ trọn gói 8 triệu. Họ đóng gói, vận chuyển, sắp xếp lại ở nhà mới. Tiết kiệm thời gian và công sức. Tuy nhiên cần chọn công ty uy tín, một số đồ dễ vỡ nên tự đóng gói. Nhìn chung hài lòng với dịch vụ.', 28, 3, 'review', NULL, NULL, 'moving service,relocation,home service,furniture', 167, 'active'),
('Dịch vụ spa chăm sóc da mặt - Có đáng đầu tư?', 'Đã đi spa facial treatment 5 lần trong 3 tháng. Mỗi lần 1.2 triệu cho deep cleansing + hydrating mask. Da sáng mịn hơn rõ rệt so với chỉ dùng skincare tại nhà. Tuy nhiên chi phí khá cao. Nếu có budget thì 1 tháng 1-2 lần là tối ưu. Cần chọn spa uy tín có chuyên viên giỏi.', 5, 26, 'review', NULL, NULL, 'spa,facial,skincare,beauty service,treatment', 334, 'active'),
('Dịch vụ giặt ủi cao cấp cho quần áo công sở', 'Thử dịch vụ giặt ủi pickup & delivery cho suit và áo sơ mi. 150k/bộ suit, 50k/áo sơ mi. Họ đến tận nơi lấy và giao lại sau 2 ngày. Quần áo sạch thơm, ủi phẳng phiu. Tiện lợi cho dân văn phòng bận rộn. Giá hơi cao nhưng chất lượng tốt, tiết kiệm thời gian.', 27, 21, 'review', NULL, NULL, 'laundry service,dry cleaning,office wear,convenience', 198, 'active'),

-- Additional posts to reach 60
('Xu hướng công nghệ 2024 - AI sẽ thay đổi mọi thứ', 'AI đang penetrate vào mọi lĩnh vực từ smartphone đến ô tô. ChatGPT, Claude đã thay đổi cách làm việc. Smartphone tích hợp AI chip xử lý nhanh hơn. Tuy nhiên cần cân nhắc về privacy và job displacement. 2024 sẽ là năm bùng nổ của AI applications.', 18, 1, 'discussion', NULL, NULL, 'AI,technology trend,future,innovation,2024', 567, 'active'),
('Coffee setup tại nhà với 5 triệu - Từ máy pha đến hạt', 'Là coffee addict, đã đầu tư 5 triệu cho home coffee setup. Máy espresso Delonghi, máy xay Timemore, cân điện tử, các tool pha manual. Hạt coffee chuyên gia từ The Coffee House và Trung Nguyên Legend. Chất lượng tương đương cafe ngoài hàng, tiết kiệm chi phí dài hạn.', 37, 32, 'discussion', NULL, NULL, 'coffee,home brewing,espresso,setup,barista', 445, 'active'),
('Lựa chọn cây cảnh phù hợp cho chung cư thiếu ánh sáng', 'Chung cư mình hướng Tây, ánh sáng ít. Muốn trồng cây xanh trang trí. Đã thử monstera, snake plant, ZZ plant - đều sống tốt. Cần chậu có lỗ thoát nước, đất trồng chuyên dụng. Tưới 2-3 lần/tuần. Cây không chỉ trang trí mà còn lọc không khí.', 38, 37, 'discussion', NULL, NULL, 'indoor plants,apartment,gardening,decoration,air purifying', 334, 'active'),
('Đánh giá khóa học online lập trình Full-stack', 'Vừa hoàn thành khóa Full-stack JavaScript trên Udemy. 50 tiếng học, từ HTML/CSS cơ bản đến React/Node.js nâng cao. Instructor giảng dễ hiểu, có project thực tế. Giá 500k khi sale. Sau khóa có thể tự build web app hoàn chỉnh. Recommend cho ai muốn chuyển nghề dev.', 25, 59, 'review', NULL, NULL, 'online course,programming,full-stack,JavaScript,career change', 456, 'active'),
('Kinh nghiệm mua đồ cũ chất lượng trên Facebook', 'Đã mua nhiều đồ second-hand trên Facebook Marketplace. MacBook, iPhone, đồ gia dụng... giá rẻ hơn 30-50% so với mới. Tips: check kỹ hình ảnh, hỏi reason bán, test kỹ khi gặp mặt. Gặp ở nơi đông người, thanh toán khi đã check OK. Tiết kiệm được nhiều tiền.', 30, 1, 'discussion', NULL, NULL, 'second-hand,Facebook Marketplace,budget shopping,tips', 389, 'active');

-- ========================================
-- SAMPLE DATA FOR REVIEWS TABLE (60 records)
-- ========================================
INSERT INTO reviews (product_id, user_id, rating, comment, media, helpful_count, status) VALUES
-- iPhone 15 Pro Max reviews
(1, 2, 5, 'iPhone 15 Pro Max thực sự xuất sắc! Camera 48MP chụp ảnh cực kỳ sắc nét, đặc biệt là chế độ Portrait. Chip A17 Pro mạnh mẽ, chạy game AAA mượt mà. Pin kéo dài cả ngày sử dụng nặng. Thiết kế titanium sang trọng và nhẹ hơn thế hệ trước. Đáng từng đồng!', NULL, 45, 'active'),
(1, 6, 4, 'Máy tốt nhưng giá hơi cao. Camera thật sự ấn tượng, zoom 5x rất sắc nét. Tuy nhiên so với Android flagship thì tính năng còn hạn chế. iOS vẫn kín đáo như thường lệ. Phù hợp cho ai đã quen hệ sinh thái Apple.', NULL, 23, 'active'),
(1, 15, 3, 'Chất lượng OK nhưng không breakthrough lắm so với iPhone 14 Pro Max. Giá 33 triệu hơi đắt. Nếu đang dùng 13 hoặc 14 Pro Max thì chưa cần thiết upgrade. USB-C là điểm cộng duy nhất đáng kể.', NULL, 12, 'active'),

-- Samsung Galaxy S24 Ultra reviews  
(2, 3, 5, 'Galaxy S24 Ultra là flagship Android tốt nhất hiện tại! S Pen rất tiện để ghi chú nhanh. Camera 200MP chụp ảnh cực chi tiết. AI features hữu ích cho công việc. Màn hình 6.8 inch sáng rõ ngay dưới nắng. Highly recommended!', NULL, 38, 'active'),
(2, 10, 4, 'Điện thoại tốt với nhiều tính năng AI thú vị. Camera zoom 100x impressive dù chỉ để chơi. S Pen thuận tiện cho việc edit ảnh. Pin kéo dài 1.5 ngày. Tuy nhiên OneUI vẫn hơi bloatware. Giá cũng không rẻ.', NULL, 29, 'active'),

-- MacBook Pro M3 reviews
(3, 7, 5, 'MacBook Pro M3 thực sự là game changer cho developer! Compile code nhanh gấp đôi Intel MacBook. Pin kéo dài 12-14 tiếng coding. Màn hình Liquid Retina XDR cực đẹp. Quạt gần như không chạy ngay cả khi load nặng. Đắt nhưng xứng đáng!', NULL, 56, 'active'),
(3, 39, 4, 'Performance M3 thật sự ấn tượng, đặc biệt với app native. Tuy nhiên vẫn có một số compatibility issues với tool Windows. Keyboard và trackpad tuyệt vời. Design đẹp nhưng hơi nặng để mang đi. Overall rất hài lòng.', NULL, 31, 'active'),

-- AirPods Pro 2 reviews
(7, 15, 5, 'AirPods Pro 2 có noise cancellation đỉnh cao! Ngồi quán cafe ồn ào mà vẫn nghe nhạc rõ ràng. Spatial Audio trên Apple Music thật sự immersive. Transparency mode tự nhiên. Pin kéo dài cả ngày. Best wireless earbuds cho iPhone user!', NULL, 67, 'active'),
(7, 5, 4, 'Chất lượng âm thanh tốt, noise cancelling hiệu quả. Tuy nhiên giá hơi đắt so với các đối thủ Android. Phù hợp nhất cho ai đã dùng iPhone. Call quality rất tốt. Adaptive EQ làm âm thanh cân bằng hơn.', NULL, 34, 'active'),

-- Apple Watch Series 9 reviews
(9, 10, 4, 'Apple Watch Series 9 nâng cấp đáng kể so với Series 8. Double Tap feature rất tiện khi tay bận. Chip S9 nhanh hơn rõ rệt. Health tracking chính xác. Tuy nhiên pin vẫn chỉ 1 ngày, chưa có breakthrough về battery life.', NULL, 28, 'active'),
(9, 8, 5, 'Smartwatch tốt nhất cho fitness tracking! Heart rate monitor chính xác, sleep tracking chi tiết. Workout detection tự động. ECG và Blood Oxygen hữu ích. Always-on display tiện lợi. Đáng đầu tư cho ai quan tâm sức khỏe.', NULL, 42, 'active'),

-- Gaming gear reviews
(11, 4, 5, 'Razer DeathAdder V3 Pro là chuột gaming tuyệt vời! Sensor Focus Pro 30K cực kỳ chính xác. Click response nhanh, zero latency. Ergonomic thoải mái cho tay phải. Pin kéo dài 90 tiếng. Đắt nhưng worth it cho competitive gaming.', NULL, 23, 'active'),
(12, 50, 4, 'Logitech G Pro X Superlight nhẹ như không có gì! 63g perfect cho flick shots. HERO sensor reliable. Tuy nhiên thiếu RGB và customization. Build quality tốt. Recommend cho pro gamer muốn performance thuần túy.', NULL, 19, 'active'),

-- Fashion reviews
(17, 22, 4, 'Áo sơ mi Oxford chất lượng tốt với giá 890k. Cotton 100% mềm mại, không nhăn nhiều. Regular fit vừa vặn. Màu trắng basic dễ phối đồ. Tuy nhiên sau vài lần giặt hơi phai màu. Overall good value for money.', NULL, 15, 'active'),
(19, 3, 5, 'Giày Nike Air Force 1 classic không bao giờ lỗi mốt! Chất liệu da synthetic bền bỉ. Air cushioning êm ái khi đi bộ. Design clean, dễ phối với mọi outfit. Giá 2.8 triệu hợp lý. Must-have trong tủ giày!', NULL, 34, 'active'),

-- Beauty products reviews
(21, 5, 5, 'Son MAC matte liquid amazing! Màu đẹp, lên môi chuẩn. Lâu trôi thật sự 8 tiếng không cần touch up. Không khô môi như các dòng matte khác. Giá 650k hơi cao nhưng chất lượng xứng đáng. Love it!', NULL, 28, 'active'),
(22, 19, 4, 'Serum Vitamin C The Ordinary hiệu quả thật! Da sáng màu rõ rệt sau 1 tháng dùng. Đốm nâu mờ đi. Giá cực kỳ reasonable chỉ 1.8 triệu. Tuy nhiên texture hơi sticky. Cần dùng sunscreen để tránh kích ứng.', NULL, 45, 'active'),

-- Home appliances reviews
(26, 23, 5, 'Nồi cơm điện Zojirushi đắt nhưng đáng tiền! IH heating làm cơm dẻo mềm đều. 20 chế độ nấu đa dạng. Keep warm 12 tiếng cơm vẫn ngon. Build quality excellent. Nếu gia đình ăn cơm nhiều thì invest đáng giá.', NULL, 31, 'active'),
(27, 12, 4, 'Máy giặt LG AI DD Technology thông minh! Tự động điều chỉnh chế độ giặt theo từng loại vải. Inverter motor êm ái, tiết kiệm điện. 9kg đủ cho gia đình 4-5 người. Giá 16 triệu hơi cao nhưng chất lượng tốt.', NULL, 22, 'active'),

-- Sports equipment reviews
(29, 8, 4, 'Tạ đôi Adidas 20kg chất lượng tốt! Cao su bọc chống trượt hiệu quả. Grip ergonomic thoải mái. Phù hợp tập tại nhà. Giá 1.8 triệu reasonable. Tuy nhiên smell cao su khá nặng ban đầu. Overall good choice cho home gym.', NULL, 18, 'active'),
(30, 49, 5, 'Giày Adidas Ultraboost 22 là best running shoes ever! Boost midsole cực kỳ êm ái. Primeknit upper ôm chân perfect. Suitable cho long run và daily training. Đã chạy 500km vẫn còn nguyên form. Worth every penny!', NULL, 39, 'active'),

-- Additional reviews for various products
(4, 25, 3, 'Dell XPS 13 Plus design đẹp nhưng có vài vấn đề. Màn hình 3.5K sắc nét. Performance tốt cho coding. Tuy nhiên keyboard touch bar hơi khó sử dụng. Pin chỉ kéo dài 6-7 tiếng. Webcam quality average.', NULL, 16, 'active'),
(5, 11, 5, 'Sony A7R V là beast cho photography! 61MP sensor cho detail cực cao. Low light performance tuyệt vời. 8K video recording professional. Build quality excellent. Đắt nhưng đáng giá cho photographer chuyên nghiệp.', NULL, 33, 'active'),
(6, 11, 4, 'Canon R6 Mark II balanced camera cho mọi nhu cầu. 24MP đủ cho hầu hết use case. Dual Pixel AF nhanh và chính xác. 4K 60fps smooth. Battery life tốt hơn thế hệ trước. Good choice cho content creator.', NULL, 25, 'active'),
(8, 15, 4, 'Sony WH-1000XM5 có noise cancelling tốt nhưng không vượt trội AirPods Pro 2 nhiều. Sound quality excellent với LDAC. Comfort tốt cho long listening sessions. App control đầy đủ. Giá 9 triệu hơi cao.', NULL, 27, 'active'),
(10, 10, 3, 'Samsung Galaxy Watch 6 tốt cho Android user. Health tracking đầy đủ. Wear OS 4 smooth. Tuy nhiên battery life chỉ 1.5 ngày. Build quality okay. Phù hợp cho ai không dùng iPhone, otherwise Apple Watch better.', NULL, 14, 'active'),
(13, 4, 4, 'SteelSeries Apex Pro TKL innovative với OmniPoint switches. Có thể adjust actuation point rất cool. OLED display hữu ích. RGB đẹp. Tuy nhiên giá 5.4 triệu khá cao cho keyboard. Build quality premium.', NULL, 21, 'active'),
(14, 4, 5, 'ASUS ROG Swift PG32UQX là ultimate gaming monitor! 4K 144Hz với Mini LED HDR đẹp mê ly. G-Sync Ultimate smooth như butter. Color accuracy excellent. Giá 43 triệu very expensive nhưng best của best.', NULL, 17, 'active'),
(15, 35, 4, 'Xiaomi Robot Vacuum S10+ tiện lợi cho busy family. AI navigation smart, mapping chính xác. Auto-empty station giảm maintenance. 4000Pa suction đủ mạnh. Giá 13 triệu reasonable. App control user-friendly.', NULL, 26, 'active'),
(16, 35, 3, 'Philips Hue Starter Kit good entry point vào smart lighting. 16 triệu màu đa dạng. App control responsive. Voice control hoạt động tốt. Tuy nhiên giá hơi cao cho 3 bulbs. Ecosystem lock-in với Philips.', NULL, 13, 'active'),
(18, 3, 4, 'Quần jean Levi\'s skinny fit tốt với chất liệu co giãn. High waist flattering. Màu xanh đậm versatile. Quality ổn với giá 1.2 triệu. Tuy nhiên sizing hơi inconsistent. Need to try before buying.', NULL, 19, 'active'),
(20, 3, 5, 'Túi Charles & Keith tote da thật excellent quality! Size lớn đủ đựng laptop 13 inch. Da bò thật mềm mại. Design minimalist timeless. Giá 3.4 triệu reasonable cho genuine leather. Recommend!', NULL, 24, 'active'),
(23, 55, 5, 'Nước hoa Chanel Bleu luxury scent! Hương gỗ citrus sophisticated. Projection tốt, longevity 6-8 tiếng. Bottle design elegant. Giá 3.8 triệu cho 100ml worth it. Compliment magnet!', NULL, 32, 'active'),
(24, 54, 4, 'Nhẫn Pandora bạc 925 chất lượng tốt. Đá CZ lấp lánh đẹp. Design tinh tế. Tuy nhiên giá 1.2 triệu hơi cao cho silver jewelry. Brand value Pandora đáng tin cậy. Good gift choice.', NULL, 16, 'active'),
(25, 12, 4, 'Bàn IKEA gỗ sồi sturdy và đẹp. 120x60cm đủ rộng cho work setup. Có ngăn kéo tiện lợi. Assembly instruction clear. Giá 4.8 triệu reasonable cho solid wood. Good investment cho home office.', NULL, 20, 'active'),
(28, 12, 3, 'Đèn LED Philips smart lighting convenient. 16 triệu màu via app control. Brightness adjustment smooth. Tuy nhiên setup initial hơi complicated. Giá 2.8 triệu okay. Good cho mood lighting.', NULL, 11, 'active'),
(29, 32, 4, 'Máy khoan Bosch Professional powerful tool! 850W motor đủ mạnh cho concrete. 3 chế độ versatile. Build quality excellent. Kèm drill bits complete set. Giá 3.5 triệu fair cho professional grade.', NULL, 18, 'active'),
(31, 17, 3, 'Bóng đá Adidas FIFA design đẹp nhưng quality average. Size 5 standard. Da PU okay cho recreational play. Giá 890k hơi cao cho amateur ball. Professional players might need better quality.', NULL, 9, 'active'),
(32, 17, 5, 'Vợt Yonex carbon excellent cho intermediate players! Balance head heavy perfect cho smash power. 88g weight comfortable. String tension 30lbs good starting point. Giá 2.8 triệu worth it cho quality racket.', NULL, 22, 'active'),
(33, 40, 4, 'Thảm yoga Manduka TPE eco-friendly và grip tốt. 6mm thickness comfortable. 183x61cm size standard. Anti-slip hiệu quả. Nhiều màu để chọn. Giá 890k reasonable cho premium yoga mat.', NULL, 27, 'active'),
(34, 43, 5, 'Xe đạp Giant carbon frame exceptional! Shimano 105 groupset reliable. 22 speed enough cho road cycling. Wheel 700c smooth rolling. Giá 33 triệu expensive nhưng performance excellent. Serious cyclist only.', NULL, 15, 'active'),
(35, 14, 5, 'Atomic Habits life-changing book! James Clear viết dễ hiểu, practical advice. Framework cụ thể để build good habits. Đã apply được nhiều techniques successfully. Giá 189k very affordable. Must read!', NULL, 78, 'active'),
(36, 14, 4, 'Sách Toán 12 comprehensive content. Chương trình 2018 updated. Có đầy đủ bài tập và solutions. Layout clear, easy to follow. Giá 89k standard cho textbook. Good preparation cho university entrance.', NULL, 12, 'active'),
(37, 27, 4, 'Bút gel Pilot G2 smooth writing experience. 0.7mm tip perfect cho daily use. Ink không lem, flow consistent. Ergonomic grip comfortable. Giá 45k very affordable. Reliable choice cho students.', NULL, 23, 'active'),
(38, 27, 3, 'Máy in Canon Pixma decent cho home use. Print quality acceptable. Wifi connection convenient. Scan function works well. Tuy nhiên cartridge cost high long-term. Giá 3.2 triệu reasonable entry level.', NULL, 14, 'active'),
(39, 34, 4, 'Máy đo huyết áp Omron accurate và reliable. Easy to use, clear LCD display. Memory 90 readings helpful tracking. Arrhythmia detection useful. Giá 1.8 triệu worth investment cho health monitoring.', NULL, 29, 'active'),
(40, 8, 4, 'Massage gun Theragun effective sau workout! 5 speeds đa dạng intensity. 4 attachments cho different muscle groups. Battery life 150 minutes impressive. Noise level acceptable. Giá 2.8 triệu okay.', NULL, 25, 'active'),
(41, 34, 3, 'Omega-3 Nature Made quality supplement. 1000mg EPA+DHA adequate dosage. No fishy taste good point. USP verified trustworthy. Tuy nhiên effect cần time để thấy. Giá 890k standard cho 100 viên.', NULL, 17, 'active'),
(42, 20, 4, 'Royal Canin dog food quality nutrition. Protein 26% adequate cho adult dogs. Dog loves the taste. Packaging convenient 15kg. Giá 890k reasonable cho premium brand. Good investment cho pet health.', NULL, 21, 'active'),
(43, 20, 3, 'Lồng hamster Ferplast spacious design. 3 tầng provide good space. Accessories included complete. Easy assembly. Tuy nhiên plastic quality average. Giá 1.2 triệu okay cho feature set.', NULL, 13, 'active'),
(44, 21, 5, 'Balo Osprey 65L excellent cho trekking! Anti-Gravity suspension comfortable. Rain cover included thoughtful. Lifetime warranty impressive. Build quality outstanding. Giá 9 triệu expensive nhưng worth long-term investment.', NULL, 31, 'active'),
(45, 52, 4, 'Lều Coleman 2 người easy setup. Dome design stable trong wind. Waterproof 3000mm adequate. 2.1x1.4m size comfortable cho 2 adults. Giá 3.4 triệu reasonable cho quality camping gear.', NULL, 19, 'active'),
(46, 26, 5, 'Xe đẩy Bugaboo premium quality! Aluminum frame lightweight yet sturdy. All-terrain wheels smooth rolling. Easy folding mechanism. 0-4 years longevity excellent. Giá 18 triệu expensive nhưng worth it.', NULL, 26, 'active'),
(47, 26, 4, 'LEGO Creator 3-in-1 creative building experience! 1210 pieces provide hours of fun. 3 different models increase replay value. Age 9+ appropriate complexity. Giá 2.8 triệu fair cho LEGO quality.', NULL, 22, 'active'),
(48, 13, 4, 'Lốp Michelin Pilot Sport excellent grip! Wet performance A rating reliable. Fuel efficiency B acceptable. Sport compound responsive steering. Giá 4.8 triệu expensive nhưng safety worth it.', NULL, 16, 'active'),
(49, 13, 3, 'Dầu Castrol GTX decent protection. Semi-synthetic formula balanced price/performance. API SN standard adequate. 10000km change interval convenient. Giá 890k cho 4L reasonable cho regular maintenance.', NULL, 12, 'active'),
(50, 2, 4, 'Cáp Apple USB-C to Lightning original quality. Fast charging compatible iPhone. MFi certified reliable. 1m length practical daily use. Giá 890k hơi cao cho cable nhưng durability tốt.', NULL, 18, 'active'),
(51, 6, 4, 'Ốp lưng Apple silicone premium feel. Soft material comfortable grip. Camera protection adequate. Wireless charging compatible. Multiple colors available. Giá 590k reasonable cho official accessory.', NULL, 24, 'active'),
(52, 39, 5, 'Chuột Logitech MX productivity beast! Darkfield sensor works on any surface. 7 buttons customizable workflow. Battery 70 days impressive. Multi-device switching convenient. Giá 2.2 triệu worth it!', NULL, 33, 'active'),
(53, 39, 4, 'Bàn phím Keychron K2 mechanical goodness! 75% layout compact. Hot-swappable switches future-proof. RGB lighting beautiful. Wireless + USB-C flexibility. Giá 2.8 triệu reasonable cho features.', NULL, 28, 'active');

-- ========================================
-- SAMPLE DATA FOR COMMENTS TABLE (60 records)
-- ========================================
INSERT INTO comments (post_id, user_id, content, status) VALUES
-- Comments on iPhone 15 Pro Max review
(1, 6, 'Mình cũng đang cân nhắc nâng cấp từ iPhone 13 Pro Max. Camera có thực sự khác biệt nhiều không bạn?', 'active'),
(1, 10, 'Giá 33 triệu thật sự đắt quá. Có thể đợi iPhone 16 ra rồi mua 15 Pro Max giá rẻ hơn.', 'active'),
(1, 15, 'USB-C cuối cùng đã có trên iPhone! Đây là lý do chính khiến mình muốn upgrade.', 'active'),
(1, 4, 'Gaming trên iPhone 15 Pro Max có mượt hơn Android flagship không? Đang phân vân giữa iPhone và ROG Phone.', 'active'),

-- Comments on MacBook Pro M3 comparison
(2, 25, 'Mình đang học lập trình, bạn recommend MacBook hay Dell cho web development?', 'active'),
(2, 7, 'MacBook Pro M3 thực sự worth it cho developer. Battery life và performance vượt trội.', 'active'),
(2, 12, 'Dell XPS 13 cũng tốt mà, giá rẻ hơn MacBook nhiều. Plus có thể upgrade RAM và SSD.', 'active'),

-- Comments on camera advice post
(3, 5, 'Nếu chủ yếu chụp portrait thì Canon R6 Mark II có dual pixel AF tốt hơn đó bạn.', 'active'),
(3, 19, 'Sony A7 IV màu sắc đẹp hơn, nhưng menu phức tạp hơn Canon. Tùy theo sở thích thôi.', 'active'),
(3, 11, 'Budget 20-30 triệu nên cân nhắc thêm Fujifilm X-T5. Màu film simulation rất đẹp.', 'active'),

-- Comments on AirPods Pro 2 review
(4, 2, 'So với Sony WH-1000XM5 thì noise cancelling của AirPods Pro 2 thế nào?', 'active'),
(4, 8, 'Mình dùng AirPods Pro 2 tập gym rất tốt, không bị rơi và chống mồ hôi hiệu quả.', 'active'),
(4, 22, 'Spatial Audio thực sự game changer khi xem phim trên iPad. Immersive vô cùng!', 'active'),

-- Comments on Apple Watch Series 9 review
(5, 34, 'Double Tap feature có thực sự practical không? Hay chỉ là gimmick?', 'active'),
(5, 8, 'Series 9 fitness tracking chính xác hơn Series 8 rõ rệt. Heart rate và sleep đều tốt hơn.', 'active'),

-- Comments on gaming setup post
(6, 50, 'Setup 120 triệu thật sự impressive! Bạn có test benchmark score không?', 'active'),
(6, 18, 'RTX 4080 với 4K gaming thì cần monitor nào để maximize performance?', 'active'),
(6, 15, 'Mình cũng đang tích cóp build PC gaming. Bạn có guide chi tiết không?', 'active'),

-- Comments on gaming mouse question
(7, 4, 'Razer DeathAdder V3 Pro ergonomic hơn, Logitech nhẹ hơn. Tùy theo style grip.', 'active'),
(7, 12, 'FPS thì Logitech G Pro X Superlight tốt hơn vì nhẹ, flick shot dễ hơn.', 'active'),

-- Comments on mechanical keyboard post
(8, 39, 'Red switch tốt cho gaming vì linear, Blue switch tốt cho typing vì tactile feedback.', 'active'),
(8, 25, 'Hot-swappable đáng đầu tư nếu muốn thử nhiều loại switch khác nhau.', 'active'),

-- Comments on smart home journey
(9, 12, 'Xiaomi ecosystem rẻ và tốt cho người mới bắt đầu smart home. Mi Home app khá ổn.', 'active'),
(9, 28, '20 triệu cho smart home toàn bộ nhà thì tính như thế nào? Có breakdown chi phí không?', 'active'),

-- Comments on robot vacuum review
(10, 23, 'Robot vacuum có làm sạch được góc tường không? Nhà mình nhiều góc khuất.', 'active'),
(10, 32, 'Auto-empty station tiện nhưng ồn quá. Mỗi lần empty là cả nhà biết.', 'active'),

-- Comments on men's fashion trend
(11, 3, 'Minimalism đúng là xu hướng 2024. Đầu tư basic pieces chất lượng tốt là khôn ngoan.', 'active'),
(11, 29, 'Earth tone colors rất dễ phối đồ. Olive và navy đặc biệt versatile.', 'active'),

-- Comments on Vitamin C serum review
(12, 5, 'The Ordinary Vitamin C có kích ứng không? Da mình khá sensitive.', 'active'),
(12, 26, 'Giá 1.8 triệu cho Vitamin C 20% là quá rẻ so với thị trường. Quality tốt surprising.', 'active'),

-- Comments on skincare routine for oily skin
(13, 24, 'BHA của Paula\'s Choice thực sự hiệu quả cho da dầu mụn. Mình dùng 6 tháng thấy cải thiện rõ.', 'active'),
(13, 19, 'Tretinoin cần prescription của bác sĩ da liễu nhé. Đừng tự ý mua online.', 'active'),

-- Comments on home office setup
(14, 27, 'Herman Miller Aeron second-hand ở đâu có bán? Ghế mới 30-40 triệu quá đắt.', 'active'),
(14, 39, 'Monitor Dell 27 inch tốt cho coding không? Độ phân giải thế nào?', 'active'),

-- Comments on rice cooker review
(15, 9, 'Zojirushi 9 triệu có đắt không? So với Tiger hoặc Panasonic thì sao?', 'active'),
(15, 37, 'IH heating thực sự làm cơm ngon hơn. Mình đã upgrade từ rice cooker thường.', 'active'),

-- Comments on gym routine for beginners
(16, 17, 'Full body workout tần suất thế nào cho người mới? 3 lần/tuần có quá nhiều không?', 'active'),
(16, 49, 'Protein 1.6g/kg cân nặng có đúng không? Mình nghe nói 2g/kg mới đủ.', 'active'),

-- Comments on running shoes review
(17, 8, 'Ultraboost 22 với 500km đã worn out chưa? Durability thế nào?', 'active'),
(17, 42, 'Adidas Ultraboost có phù hợp với người flat feet không?', 'active'),

-- Comments on yoga mat question
(18, 46, 'TPE material tốt hơn PVC về độ bám và thân thiện môi trường.', 'active'),
(18, 8, '6mm thickness ideal cho beginner. Không quá dày nhưng đủ cushioning.', 'active'),

-- Comments on Atomic Habits review
(19, 25, 'James Clear framework thực sự practical. Đã áp dụng habit stacking hiệu quả.', 'active'),
(19, 27, '1% better everyday concept rất motivating. Small changes, big results.', 'active'),

-- Comments on programming learning guide
(20, 7, 'Roadmap này rất realistic cho self-taught developer. Portfolio quan trọng hơn certificate.', 'active'),
(20, 39, 'React/Node.js stack tốt cho full-stack development. Job market demand cao.', 'active'),

-- Comments on blood pressure monitor review
(21, 8, 'Omron brand đáng tin cậy. Bác sĩ gia đình mình cũng recommend.', 'active'),
(21, 40, 'Memory 90 readings có đủ không? Gia đình mình nhiều người dùng chung.', 'active'),

-- Comments on massage gun review
(22, 17, 'Massage gun có thay thế được massage therapist không? Hiệu quả thế nào?', 'active'),
(22, 49, 'Theragun brand premium nhưng có nhiều alternatives rẻ hơn với quality tương tự.', 'active'),

-- Comments on Golden Retriever experience
(23, 26, 'Golden trong chung cư cần exercise nhiều. Có yard sẽ tốt hơn.', 'active'),
(23, 54, '2 triệu/tháng cho dog expenses là reasonable. Vet bills có thể cao hơn nếu ốm.', 'active'),

-- Comments on Sa Pa trekking checklist
(24, 16, 'Osprey 65L có quá lớn cho 3 ngày 2 đêm không? 45L có đủ không?', 'active'),
(24, 52, 'Weather Sa Pa unpredictable. Layering system quan trọng hơn single jacket.', 'active'),

-- Additional comments for remaining posts
(25, 39, 'Laptop repair service tại nhà convenient nhưng cần check reputation company kỹ.', 'active'),
(26, 35, 'AC cleaning 6 tháng/lần có quá thường xuyên không? Chi phí có cao?', 'active'),
(27, 31, 'Moving service trọn gói tiết kiệm time nhưng cần insurance cho valuable items.', 'active'),
(28, 19, 'Spa facial 1.2 triệu/session có đắt không? Home skincare routine có đủ?', 'active'),
(29, 22, 'Laundry service pickup/delivery convenient cho busy professionals. Worth the premium.', 'active'),
(30, 25, 'AI trend 2024 thực sự exciting. Job market sẽ thay đổi dramatically.', 'active'),
(31, 9, 'Home coffee setup investment tốt long-term. Quality control và cost saving.', 'active'),
(32, 12, 'Indoor plants low-light varieties: pothos, snake plant, ZZ plant đều dễ chăm.', 'active'),
(33, 39, 'Udemy courses quality varies. Cần check reviews và instructor credentials.', 'active'),
(34, 28, 'Facebook Marketplace bargaining tips: research market price, check seller profile.', 'active'),
(35, 2, 'AI integration in smartphones sẽ là game changer. Processing power locally important.', 'active'),
(36, 23, 'Coffee beans quality quan trọng hơn expensive equipment. Fresh roasted preferred.', 'active'),
(37, 31, 'Low-light plants perfect cho apartment living. Air purifying bonus benefit.', 'active'),
(38, 7, 'Full-stack bootcamp tốt cho career switchers. Portfolio projects demonstrate skills.', 'active'),
(39, 29, 'Second-hand shopping sustainable choice. Environmental và financial benefits.', 'active'),
(1, 20, 'Titanium design có thực sự nhẹ hơn steel không? Daily usage có feel difference?', 'active'),
(2, 30, 'Battery life comparison giữa M3 MacBook và Dell XPS thực tế thế nào?', 'active'),
(3, 40, 'Budget 25 triệu có alternatives nào khác ngoài Sony và Canon không?', 'active'),
(4, 35, 'AirPods Pro 2 với Android phones compatibility thế nào? Features nào bị limit?', 'active'),
(5, 12, 'Apple Watch fitness tracking accuracy so với dedicated fitness watches?', 'active'),
(6, 32, 'Cable management cho gaming setup như thế nào cho clean look?', 'active'),
(7, 28, 'Wireless gaming mice latency có ảnh hưởng competitive gaming không?', 'active'),
(8, 15, 'Custom keycaps compatibility với hot-swappable keyboards thế nào?', 'active'),
(9, 22, 'Smart home security concerns và data privacy precautions?', 'active'),
(10, 27, 'Robot vacuum pet hair cleaning effectiveness thế nào?', 'active'),
(11, 54, 'Sustainable fashion brands recommendations cho conscious consumers?', 'active'),
(12, 30, 'Vitamin C morning routine hay evening routine tốt hơn?', 'active'),
(13, 35, 'Tretinoin prescription process và dermatologist consultation necessary?', 'active'),
(14, 25, 'Standing desk conversion options cho existing setup?', 'active'),
(15, 12, 'Rice cooker maintenance và cleaning best practices?', 'active');

