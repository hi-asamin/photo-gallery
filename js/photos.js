// 写真データ — ここだけ編集すれば全セクションに反映されます
// src は外部URL（"https://..."）でも、ローカル（"assets/photos/foo.jpg"）でもOK
// archive の layout: "default" | "tall"（縦に2行ぶち抜き）| "wide"（横に2列ぶち抜き）

window.PHOTOS = {
  hero:  "assets/photos/sample-01.jpg",

  // STORY セクションは章数に合わせて4枚（順番に切り替わります）
  story: [
    "assets/photos/sample-07.jpg",
    "assets/photos/sample-09.jpg",
    "assets/photos/sample-04.jpg",
    "assets/photos/sample-10.jpg",
  ],

  about: "assets/photos/profile.png",

  works: [
    { src: "assets/photos/sample-02.jpg", title: "Untitled — 01", location: "", year: "" },
    { src: "assets/photos/sample-03.jpg", title: "Untitled — 02", location: "", year: "" },
    { src: "assets/photos/sample-04.jpg", title: "Untitled — 03", location: "", year: "" },
    { src: "assets/photos/sample-05.jpg", title: "Untitled — 04", location: "", year: "" },
    { src: "assets/photos/sample-06.jpg", title: "Untitled — 05", location: "", year: "" },
    { src: "assets/photos/sample-08.jpg", title: "Untitled — 06", location: "", year: "" },
  ],

  archive: [
    { src: "assets/photos/sample-09.jpg", layout: "default" },
    { src: "assets/photos/sample-01.jpg", layout: "tall"    },
    { src: "assets/photos/sample-07.jpg", layout: "default" },
    { src: "assets/photos/sample-04.jpg", layout: "wide"    },
    { src: "assets/photos/sample-10.jpg", layout: "default" },
    { src: "assets/photos/sample-02.jpg", layout: "default" },
    { src: "assets/photos/sample-08.jpg", layout: "tall"    },
    { src: "assets/photos/sample-06.jpg", layout: "default" },
  ],
};
