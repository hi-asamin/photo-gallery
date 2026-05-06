// 写真データ — ここだけ編集すれば全セクションに反映されます
// src は外部URL（"https://..."）でも、ローカル（"assets/photos/foo.jpg"）でもOK
// archive の layout: "default" | "tall"（縦に2行ぶち抜き）| "wide"（横に2列ぶち抜き）

window.PHOTOS = {
  hero:  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=80&auto=format&fit=crop",
  story: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=2000&q=80&auto=format&fit=crop",
  about: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&q=80&auto=format&fit=crop",

  works: [
    { src: "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=1600&q=80&auto=format&fit=crop", title: "Quiet Mountains", location: "Hokkaido",  year: "2024" },
    { src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80&auto=format&fit=crop", title: "Hour of Blue",    location: "Aomori",    year: "2024" },
    { src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=80&auto=format&fit=crop", title: "Drifting Mist",  location: "Nagano",    year: "2025" },
    { src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1600&q=80&auto=format&fit=crop", title: "Forest Breath",  location: "Yakushima", year: "2025" },
    { src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80&auto=format&fit=crop", title: "Reflection",     location: "Nagano",    year: "2025" },
    { src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1600&q=80&auto=format&fit=crop", title: "Last Light",     location: "Iceland",   year: "2025" },
  ],

  archive: [
    { src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80&auto=format&fit=crop", layout: "default" },
    { src: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=1200&q=80&auto=format&fit=crop", layout: "tall"    },
    { src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80&auto=format&fit=crop", layout: "default" },
    { src: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1600&q=80&auto=format&fit=crop", layout: "wide"    },
    { src: "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=1200&q=80&auto=format&fit=crop", layout: "default" },
    { src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200&q=80&auto=format&fit=crop", layout: "default" },
    { src: "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=1200&q=80&auto=format&fit=crop", layout: "tall"    },
    { src: "https://images.unsplash.com/photo-1505739679850-7adfe2e6cb73?w=1200&q=80&auto=format&fit=crop", layout: "default" },
  ],
};
