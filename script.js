const slider = document.querySelector(".logo-slider");
const track = document.querySelector(".logo-track");
const logos = Array.from(track.children);

logos.forEach((logo) => {
  const clone = logo.cloneNode(true);
  track.appendChild(clone);
});

slider.addEventListener("mouseover", () => {
  track.style.animationPlayState = "paused";
});

slider.addEventListener("mouseout", () => {
  track.style.animationPlayState = "running";
});

let openMenu = document.querySelector(".menu");
let closeMenu = document.querySelector(".close")

openMenu.addEventListener("click", () => {
    document.querySelector(".mobile-nav-list").style.display = "block";
    closeMenu.style.display = "inline-block";
});

closeMenu.addEventListener("click", () => {
    document.querySelector(".mobile-nav-list").style.display = "none";
    openMenu.style.display = "inline-block";
});

const sliderWorks = document.querySelector(".works-slider");
const trackWorks = document.querySelector(".track");
const works = Array.from(trackWorks.children);
works.forEach((work) => {
  const clone = work.cloneNode(true);
  trackWorks.appendChild(clone);
});

sliderWorks.addEventListener("mouseover", ()=>{
    trackWorks.style.animationPlayState = "paused"
})

sliderWorks.addEventListener("mouseout", () =>{
  trackWorks.style.animationPlayState ="running"
})
