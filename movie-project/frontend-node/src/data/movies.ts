import { Movie, Comment } from "../types";

export const MOCK_MOVIES: Movie[] = [
  {
    id: "m-1",
    title: "Kỷ Nguyên Bóng Đêm: Khởi Đầu",
    originalTitle: "Dark Era: The Genesis",
    category: "Hành Động",
    genres: [{ id: "g-1", name: "Hành Động", slug: "hanh-dong" }],
    year: 2026,
    duration: 142,
    director: "Christopher Nolan",
    actors: ["Christian Bale", "Cillian Murphy", "Emily Blunt"],
    imdb: 8.9,
    quality: "4K",
    poster:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400",
    backdrop:
      "https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?auto=format&fit=crop&q=80&w=1200",
    synopsis:
      "Trong một tương lai giả định năm 2085, khi thế giới chìm sâu vào đại băng hà thứ hai, một nhóm chiến binh tinh nhuệ được trang bị công nghệ sinh học tối tân phải xâm nhập vào trung tâm năng lượng của lòng đất để đánh cắp hạt nhân lượng tử hạt giống ánh sáng cuối cùng. Sự thành bại của họ định đoạt vận mệnh của toàn bộ loài người còn sống sót.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    views: 124500,
    isTrending: true,
    isNew: true,
    ratingCount: 1420,
  },
  {
    id: "m-2",
    title: "Du Hành Tinh Hệ: Hố Đen Tử Thần",
    originalTitle: "Cosmic Odyssey: Event Horizon",
    category: "Viễn Tưởng",
    genres: [{ id: "g-2", name: "Viễn Tưởng", slug: "vien-tuong" }],
    year: 2025,
    duration: 168,
    director: "Denis Villeneuve",
    actors: ["Timothée Chalamet", "Zendaya", "Oscar Isaac"],
    imdb: 9.1,
    quality: "4K",
    poster:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
    backdrop:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
    synopsis:
      "Một tàu khoa học mất tích 10 năm bỗng dưng phát ra tín hiệu từ rìa hố đen siêu khối lượng. Một phi hành đoàn cứu hộ được cử đi để kiểm tra, nhưng những gì họ tìm thấy không đơn thuần là đống đổ nát của sắt thép, mà là một khe nứt không-thời gian bẻ gãy thực tại và vật lý thông thường.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    views: 310200,
    isTrending: true,
    isNew: false,
    ratingCount: 3410,
  },
  {
    id: "m-3",
    title: "Akira: Kiếm Sĩ Cuối Cùng",
    originalTitle: "The Last Ronin: Akira",
    category: "Cổ Trang",
    genres: [{ id: "g-3", name: "Cổ Trang", slug: "co-trang" }],
    year: 2024,
    duration: 135,
    director: "Takashi Miike",
    actors: ["Ken Watanabe", "Takeru Satoh", "Hiroyuki Sanada"],
    imdb: 8.4,
    quality: "Full HD",
    poster:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400",
    backdrop:
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=1200",
    synopsis:
      "Lấy bối cảnh thời kỳ Edo suy vong, Akira - một Ronin chịu nhiều vết thương lòng của quá khứ, thề gác kiếm để nuôi nấng một đứa trẻ mồ côi. Nhưng khi băng đảng bóng tối truy sát gia tộc cũ tìm đến làng quê hẻo lánh của anh, anh buộc phải cầm thanh katana cổ xưa một lần cuối để lập lại trật tự và danh dự.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    views: 85000,
    isTrending: false,
    isNew: false,
    ratingCount: 780,
  },
  {
    id: "m-4",
    title: "Học Viện Pháp Thuật: Vùng Đất Bay",
    originalTitle: "Floating Kingdoms: Spirit Quest",
    category: "Hoạt Hình",
    genres: [{ id: "g-4", name: "Hoạt Hình", slug: "hoat-hinh" }],
    year: 2026,
    duration: 112,
    director: "Hayao Miyazaki",
    actors: ["Chihiro", "Haku", "Yubaba"],
    imdb: 8.8,
    quality: "Full HD",
    poster:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=400",
    backdrop:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1200",
    synopsis:
      "Câu chuyện phiêu lưu kỳ huyễn của cô bé Yuki lạc vào thành phố nổi lơ lửng giữa những đám mây cổ tích. Tại đây, cô học được phép thuật điều khiển mưa gió và hợp sức với những sinh vật huyền bí để ngăn chặn sự xâm lấn của các bóng đen công nghiệp khói bụi đang muốn đồng hoá thế giới phép thuật.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    views: 198000,
    isTrending: true,
    isNew: true,
    ratingCount: 1650,
  },
  {
    id: "m-5",
    title: "Thành Phố Mưa Tình Yêu",
    originalTitle: "Under The Neon Rain",
    category: "Tâm Lý",
    genres: [{ id: "g-5", name: "Tâm Lý", slug: "tam-ly" }],
    year: 2025,
    duration: 124,
    director: "Park Chan-wook",
    actors: ["Gong Yoo", "Song Hye-kyo", "Park Bo-gum"],
    imdb: 8.2,
    quality: "Full HD",
    poster:
      "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=400",
    backdrop:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200",
    synopsis:
      "Một câu chuyện tình đầy hoài niệm giữa hai con người cô đơn tại thủ đô Seoul hối hả. Họ tình cờ trú mưa cùng nhau bên hiên nhà cũ của một hiệu sách đóng cửa. Trải qua những thăng trầm của sự nghiệp và hiểu lầm định mệnh, tình yêu âm thầm nở hoa như cơn mưa rào mùa hạ xoa dịu tâm hồn mệt mỏi.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    views: 147000,
    isTrending: false,
    isNew: true,
    ratingCount: 920,
  },
  {
    id: "m-6",
    title: "Tiếng Thét Giữa Đêm Khuya",
    originalTitle: "Whispers in the Dark",
    category: "Kinh Dị",
    genres: [{ id: "g-6", name: "Kinh Dị", slug: "kinh-di" }],
    year: 2025,
    duration: 98,
    director: "James Wan",
    actors: ["Vera Farmiga", "Patrick Wilson", "Lupita Nyong'o"],
    imdb: 7.7,
    quality: "Full HD",
    poster:
      "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&q=80&w=400",
    backdrop:
      "https://images.unsplash.com/photo-1505635339347-ac50041d8e6a?auto=format&fit=crop&q=80&w=1200",
    synopsis:
      "Sau cái chết đột ngột của người dì, Elena thừa kế một căn dinh thự cổ biệt lập bên mặt hồ sương mù quanh năm. Từ khi dọn đến, những âm thanh thì thầm ghê rơn xuất hiện bên trong tường gỗ sau 12 giờ đêm thách thức sự tỉnh táo của cô. Bí ẩn dơ bẩn của dòng họ dần lộ diện.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    views: 165000,
    isTrending: true,
    isNew: false,
    ratingCount: 1100,
  },
  {
    id: "m-7",
    title: "Săn Lùng Quái Vật Đầm Lầy",
    originalTitle: "Swamp Beast: The Outlaw",
    category: "Hành Động",
    genres: [{ id: "g-1", name: "Hành Động", slug: "hanh-dong" }],
    year: 2026,
    duration: 115,
    director: "Victor Vũ",
    actors: ["Kiều Minh Tuấn", "Kaity Nguyễn", "Johnny Trí Nguyễn"],
    imdb: 8.0,
    quality: "Full HD",
    poster:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=400",
    backdrop:
      "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=1200",
    synopsis:
      "Tại vùng sông nước miền Tây Nam Bộ kỳ bí, những vụ mất tích kỳ dị của người dân chài đánh cá làm dấy lên nỗi sợ hãi về quái thú khổng lồ cổ xưa tái sinh. Một thợ săn điêu luyện và một nữ nhà báo dũng cảm lên đường tiến sâu vào cánh rừng tràm nguyên sinh ngập nước u tối để tìm lời giải, trước khi quân đội can thiệp tiêu hủy cả khu rừng.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    views: 220000,
    isTrending: true,
    isNew: true,
    ratingCount: 1840,
  },
  {
    id: "m-8",
    title: "Huyền Thoại Vĩnh Hằng: Thần Long",
    originalTitle: "Dragon Legend: Dynasties",
    category: "Cổ Trang",
    genres: [{ id: "g-3", name: "Cổ Trang", slug: "co-trang" }],
    year: 2025,
    duration: 154,
    director: "Trương Nghệ Mưu",
    actors: ["Ngô Kinh", "Chương Tử Di", "Dịch Dương Thiên Tỉ"],
    imdb: 8.3,
    quality: "4K",
    poster:
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=400",
    backdrop:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200",
    synopsis:
      "Dưới triều đại hưng thịnh của hoàng đế nhà Đại Đường, mâu thuẫn tranh đoạt vương vị đẩy đất nước tới nguy cơ nội chiến cốt nhục tương tàn. Sự thức tỉnh của Thần Long thần thoại ẩn chứa bảo ngọc hộ quốc tôn nghiêm buộc hai kiếm khách xuất chúng rũ bỏ ân oán giang hồ để phò tá thái tử lên ngôi kế vị.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    views: 187000,
    isTrending: false,
    isNew: false,
    ratingCount: 1250,
  },
  {
    id: "m-9",
    title: "Cao Thủ Blockchain: Phi Vụ Cuối",
    originalTitle: "The Crypto Heist",
    category: "Hành Động",
    genres: [{ id: "g-1", name: "Hành Động", slug: "hanh-dong" }],
    year: 2026,
    duration: 128,
    director: "Choi Dong-hoon",
    actors: ["Lee Jung-jae", "Kim Hye-soo", "Wi Ha-joon"],
    imdb: 8.5,
    quality: "4K",
    poster:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400",
    backdrop:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200",
    synopsis:
      "Một nhóm hacker thiên tài phối hợp cùng một cựu điệp viên mật vụ Hàn Quốc lập kế hoạch xâm nhập máy chủ siêu cấp chống đạn mật bảo mật blockchain của một tập đoàn tài chính đa quốc gia đen tối. Mục tiêu của họ không chỉ là số tiền ảo trị giá 500 triệu USD mà là vạch trần danh tính của kẻ đứng sau âm mưu thao túng bầu cử tổng thống.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    views: 245000,
    isTrending: true,
    isNew: true,
    ratingCount: 1980,
  },
  {
    id: "m-10",
    title: "Lạc Giữa Rừng Sâu",
    originalTitle: "Lost in the Pines",
    category: "Tâm Lý",
    genres: [{ id: "g-5", name: "Tâm Lý", slug: "tam-ly" }],
    year: 2024,
    duration: 105,
    director: "Trần Anh Hùng",
    actors: ["Lãnh Thanh", "Phương Anh Đào", "NSƯT Thành Lộc"],
    imdb: 7.9,
    quality: "Full HD",
    poster:
      "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=400",
    backdrop:
      "https://images.unsplash.com/photo-1505635339347-ac50041d8e6a?auto=format&fit=crop&q=80&w=1200",
    synopsis:
      "Một họa sĩ trẻ tìm kiếm cảm hứng sáng tạo đã chọn ẩn cư sâu trong một ngôi biệt thự gỗ biệt lập rậm rạp giữa rừng thông Đà Lạt lạnh giá quanh năm sương khói mờ ảo. Khi vẽ bức chân dung bí mật của một cô gái vô danh đầy u uất xuất hiện mỗi khi chiều tà, anh vô tình chạm tới ranh giới của hiện thực, giấc mơ và những bóng ma từ ký ức tuổi thơ đau thương.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    views: 65000,
    isTrending: false,
    isNew: false,
    ratingCount: 430,
  },
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: "c-1",
    author: "Nguyễn Minh Khang",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
    content:
      "Phim quá hay, đỉnh từ kỹ xảo màu sắc cho đến nhạc phim dồn dập kịch tính! Xem bản 4K trên web cực kỳ mượt mà không bị giật lag chút nào. Thích nhất lối diễn xuất của nam chính.",
    timestamp: "2 giờ trước",
    likes: 42,
  },
  {
    id: "c-2",
    author: "Trần Thị Mỹ Linh",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
    content:
      "Cốt truyện twist dồn dập cuối phim làm mình bất ngờ thực sự. Denis Villeneuve chưa bao giờ khiến người xem thất vọng với những góc quay siêu đỉnh rộng lớn như vậy.",
    timestamp: "5 giờ trước",
    likes: 28,
  },
  {
    id: "c-3",
    author: "Phan Anh Vũ",
    avatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100",
    content:
      "Trang web thiết kế đẹp quá! Tông màu đen đỏ rất hợp mắt chịu ảnh hưởng của Netflix, có chế độ tắt đèn khi xem phim rất tiện. Sẽ ủng hộ web dài dài.",
    timestamp: "1 ngày trước",
    likes: 19,
  },
];

export const CATEGORIES = [
  "Tất Cả",
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "War",
];
export const COUNTRIES = [
  "Tất Cả",
  "Mỹ",
  "Hàn Quốc",
  "Nhật Bản",
  "Trung Quốc",
  "Việt Nam",
];
// Expand YEARS to a broader range for free selection (kept as static convenience)
export const YEARS = [
  "Tất Cả",
  "2026",
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
  "2017",
  "2016",
  "2015",
];
