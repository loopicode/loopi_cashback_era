

// HERO SLIDER 
$(window).on("load", function() {
  var slideCount = $('.lp-hero .slick-slide').length;

  // Only initialize slick slider if more than one product
  if (slideCount > 1) {
      $('.slick-slider').slick({
          dots: true,
          arrows: false,
          infinite: true,
          slidesToShow: 1,
          slidesToScroll: 1,
          autoplay: true,
          autoplaySpeed: 6000
      });
  } else {
      // For single product, remove carousel behavior and ensure full width
      $('.lp-hero .slick-slider.no-carousel').addClass('single-product').removeClass('slick-slider');
  }
}); // HERO SLIDER - END


// TICKET TAPE

document.addEventListener("DOMContentLoaded", function() {
  if (document.body.classList.contains("gradient") && document.body.classList.contains("page-home")) {
      var mqr = [];
      var ticketTapes = document.querySelectorAll('.ticket-wrapper');

      function start() {
          ticketTapes.forEach(function(tape) {
              new mq(tape);
          });
          mqRotate(mqr);
      }

      function objWidth(obj) {
          if (obj.offsetWidth) return obj.offsetWidth;
          if (obj.clip) return obj.clip.width;
          return 0;
      }

      function mq(tape) {
          var textElement = tape.querySelector(".ticker-text");
          if (!textElement) return; // Check if the text element exists
          var wid = objWidth(textElement) + 10; // Adjust gap if necessary
          var fulwid = objWidth(tape);
          var txt = textElement.innerHTML;
          tape.innerHTML = "";
          var heit = tape.style.height;

          tape.onmouseout = function () {
              mqRotate(mqr);
          };

          tape.onmouseover = function () {
              clearTimeout(mqr[0].TO);
          };

          tape.ary = [];
          var maxw = Math.ceil(fulwid / wid) + 1;
          for (var i = 0; i < maxw; i++) {
              tape.ary[i] = document.createElement("div");
              tape.ary[i].innerHTML = txt;
              tape.ary[i].style.position = "absolute";
              tape.ary[i].style.left = wid * i + "px";
              tape.ary[i].style.width = wid + "px";
              tape.ary[i].style.height = heit;
              tape.appendChild(tape.ary[i]);
          }
          mqr.push(tape);
      }

      function mqRotate(mqr) {
          if (!mqr) return;
          for (var j = mqr.length - 1; j > -1; j--) {
              var maxa = mqr[j].ary.length;
              for (var i = 0; i < maxa; i++) {
                  var x = mqr[j].ary[i].style;
                  x.left = parseInt(x.left, 10) - 1 + "px";
              }

              var y = mqr[j].ary[0].style;
              if (parseInt(y.left, 10) + parseInt(y.width, 10) < 0) {
                  var z = mqr[j].ary.shift();
                  z.style.left = parseInt(z.style.left) + parseInt(z.style.width) * maxa + "px";
                  mqr[j].ary.push(z);
              }
          }

          mqr[0].TO = setTimeout(function() {
              mqRotate(mqr);
          }, 30); // Adjust timing as necessary
      }

      start();
  }
}); //END - TICKET TAPE


// MEGA MENU 
document.addEventListener("DOMContentLoaded", function () {
  
    // Mega Menu Interactions
    var items = document.querySelectorAll(".mega-menu");
    var currentItemIndex;
  
    items.forEach((item, itemIndex) => {
      const content = item.querySelector(".mega-menu__content");
      item.addEventListener("mouseover", () => {
        if (
          (currentItemIndex === 0 && currentItemIndex !== itemIndex) ||
          (currentItemIndex && currentItemIndex !== itemIndex)
        ) {
          items[currentItemIndex].removeAttribute("open");
        }
  
        currentItemIndex = itemIndex;
        item.setAttribute("open", true);
      });
  
      item.addEventListener("mouseleave", (event) => {
        var close = true;
  
        const closeTimeout = setTimeout(() => {
          if (close) item.removeAttribute("open");
        }, 500);
  
        content.addEventListener("mouseover", () => {
          close = false;
        });
  
        item.addEventListener("mouseover", () => {
          clearTimeout(closeTimeout);
        });
      });
  
      content.addEventListener("mouseleave", () => {
        item.removeAttribute("open");
      });
    });
  
    // Featured Products Menu and Mega Menu Links
    const featuredProducts = document.querySelector(".featured-products-menu");
    const imageBlock = document.querySelector(".image-block");
    if (featuredProducts !== undefined && featuredProducts !== null) {
      featuredProducts.style.display = "block";
    }
  
    document.querySelectorAll(".mega-menu__link").forEach((link) => {
      link.addEventListener("click", function (event) {
        const href = this.getAttribute("href");
  
        if (href === "#" || href.trim() === "") {
          event.preventDefault();
        }
  
        const parentLi = this.closest("li");
        const submenu = this.nextElementSibling;
        const icon = this.querySelector("svg");
  
        document.querySelectorAll(".mega-menu__link + ul").forEach((otherSubmenu) => {
          if (otherSubmenu !== submenu) {
            otherSubmenu.style.display = "none";
          }
        });
  
        document.querySelectorAll(".mega-menu__link").forEach((otherLink) => {
          otherLink.classList.remove("mega-active");
          otherLink.closest("li").classList.remove("active");
        });
  
        document.querySelectorAll(".mega-menu__link svg").forEach((otherIcon) => {
          otherIcon.style.transform = "rotate(0deg)";
        });
  
        if (submenu && submenu.tagName === "UL") {
          if (submenu.style.display === "block") {
            submenu.style.display = "none";
            if (featuredProducts !== undefined && featuredProducts !== null) {
              featuredProducts.style.display = "block";
            }
            imageBlock.style.display = "none";
            this.classList.remove("mega-active");
            parentLi.classList.remove("active");
            if (icon) icon.style.transform = "rotate(0deg)";
          } else {
            submenu.style.display = "block";
            if (featuredProducts !== undefined && featuredProducts !== null) {
              featuredProducts.style.display = "none";
            }
            imageBlock.style.display = "none";
            this.classList.add("mega-active");
            parentLi.classList.add("active");
            if (icon) icon.style.transform = "rotate(180deg)";
          }
        } else if (href && href !== "#") {
          window.location.href = href;
        }
  
        event.stopPropagation();
      });
    });
}); // END - MEGA MENU 
