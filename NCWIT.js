tabs = ["all","t3Q","b3Q","t3Education","t3Staff","t3SelfReported","t3Safety","t3Impact","t3Support","allStaff"];
// Sets the initial tabPosition to 0 (all)

tabPosition = 1;

$(document).ready(function() {  // do when document is loaded
    switchTabs(tabPosition)
    console.log(tabPosition)
});


// When you click a button, use the switchTabs() function
$("#all").click(function() {
  switchTabs(0)
});

$("#t3Q").click(function() {
  switchTabs(1)
});

$("#b3Q").click(function() {
  switchTabs(2)
});

$("#t3Education").click(function() {
  switchTabs(3)
});

$("#t3Staff").click(function() {
  switchTabs(4)
});

$("#t3SelfReported").click(function() {
  switchTabs(5)
});

$("#t3Safety").click(function() {
  switchTabs(6)
});

$("#t3Impact").click(function() {
  switchTabs(7)
});

$("#t3Support").click(function() {
  switchTabs(8)
});

$("#allStaff").click(function() {
  switchTabs(9)
});
// This function switches highlight and content based on tabPosition.
// tabPosition 0 = all; 1 = upon enrollment; 2 = end of first year; 3 = end of second year; 4 = other

function switchTabs(tabPosition) {
  if (tabPosition == 0){
    // Show all majors image and hide others
      $("#all-content").show();
      $("#t3Q-content").hide();
      $("#b3Q-content").hide();
      $("#t3Education-content").hide();      
      $("#t3Staff-content").hide();
      $("#t3SelfReported-content").hide();
      $("#t3Safety-content").hide();
      $("#t3Impact-content").hide();
      $("#t3Support-content").hide();
      $("#allStaff-content").hide();

  // Make all majors button active and all others inactive
      $("#all").addClass("active");
      $("#t3Q").removeClass("active");
      $("#b3Q").removeClass("active");
      $("#t3Education").removeClass("active");
      $("#t3Staff").removeClass("active");
      $("#t3SelfReported").removeClass("active");
      $("#t3Safety").removeClass("active");
      $("#t3Impact").removeClass("active");
      $("#t3Support").removeClass("active");
      $("#allStaff").removeClass("active");

    // reset tabPosition (just in case)
      tabPosition = 0;
  }

  if (tabPosition == 1){
    // Show upon enrollment image and hide others
    $("#all-content").hide();
    $("#t3Q-content").show();
    $("#b3Q-content").hide();
    $("#t3Education-content").hide();      
    $("#t3Staff-content").hide();
    $("#t3SelfReported-content").hide();
    $("#t3Safety-content").hide();
    $("#t3Impact-content").hide();
    $("#t3Support-content").hide();
    $("#allStaff-content").hide();

    // Make upon enrollment button active and all others inactive
    $("#all").removeClass("active");
    $("#t3Q").addClass("active");
    $("#b3Q").removeClass("active");
    $("#t3Education").removeClass("active");
    $("#t3Staff").removeClass("active");
    $("#t3SelfReported").removeClass("active");
    $("#t3Safety").removeClass("active");
    $("#t3Impact").removeClass("active");
    $("#t3Support").removeClass("active");
    $("#allStaff").removeClass("active");

      tabPosition = 1;
  }
  if (tabPosition == 2){

    // Show end of first year  image and hide others
    $("#all-content").hide();
    $("#t3Q-content").hide();
    $("#b3Q-content").show();
    $("#t3Education-content").hide();      
    $("#t3Staff-content").hide();
    $("#t3SelfReported-content").hide();
    $("#t3Safety-content").hide();
    $("#t3Impact-content").hide();
    $("#t3Support-content").hide();
    $("#allStaff-content").hide();

    // Make end of first year  button active and all others inactive
    $("#all").removeClass("active");
    $("#t3Q").removeClass("active");
    $("#b3Q").addClass("active");
    $("#t3Education").removeClass("active");
    $("#t3Staff").removeClass("active");
    $("#t3SelfReported").removeClass("active");
    $("#t3Safety").removeClass("active");
    $("#t3Impact").removeClass("active");
    $("#t3Support").removeClass("active");
    $("#allStaff").removeClass("active");

    tabPosition = 2;

  }
  if (tabPosition == 3){

    // Show end of second year image and hide others
    $("#all-content").hide();
    $("#t3Q-content").hide();
    $("#b3Q-content").hide();
    $("#t3Education-content").show();      
    $("#t3Staff-content").hide();
    $("#t3SelfReported-content").hide();
    $("#t3Safety-content").hide();
    $("#t3Impact-content").hide();
    $("#t3Support-content").hide();
    $("#allStaff-content").hide();



    // Make end of second year button active and all others inactive
    $("#all").removeClass("active");
    $("#t3Q").removeClass("active");
    $("#b3Q").removeClass("active");
    $("#t3Education").addClass("active");
    $("#t3Staff").removeClass("active");
    $("#t3SelfReported").removeClass("active");
    $("#t3Safety").removeClass("active");
    $("#t3Impact").removeClass("active");
    $("#t3Support").removeClass("active");
    $("#allStaff").removeClass("active");


      tabPosition = 3;
  }

  if (tabPosition == 4){

    // Show end of second year image and hide others
    $("#all-content").hide();
    $("#t3Q-content").hide();
    $("#b3Q-content").hide();
    $("#t3Education-content").hide();      
    $("#t3Staff-content").show();
    $("#t3SelfReported-content").hide();
    $("#t3Safety-content").hide();
    $("#t3Impact-content").hide();
    $("#t3Support-content").hide();
    $("#allStaff-content").hide();

    // Make end of second year button active and all others inactive
    $("#all").removeClass("active");
    $("#t3Q").removeClass("active");
    $("#b3Q").removeClass("active");
    $("#t3Education").removeClass("active");
    $("#t3Staff").addClass("active");
    $("#t3SelfReported").removeClass("active");
    $("#t3Safety").removeClass("active");
    $("#t3Impact").removeClass("active");
    $("#t3Support").removeClass("active");
    $("#allStaff").removeClass("active");

    tabPosition = 4;
  }

  if (tabPosition == 5){

    // Show end of second year image and hide others
    $("#all-content").hide();
    $("#t3Q-content").hide();
    $("#b3Q-content").hide();
    $("#t3Education-content").hide();      
    $("#t3Staff-content").hide();
    $("#t3SelfReported-content").show();
    $("#t3Safety-content").hide();
    $("#t3Impact-content").hide();
    $("#t3Support-content").hide();
    $("#allStaff-content").hide();

    // Make end of second year button active and all others inactive
    $("#all").removeClass("active");
    $("#t3Q").removeClass("active");
    $("#b3Q").removeClass("active");
    $("#t3Education").removeClass("active");
    $("#t3Staff").removeClass("active");
    $("#t3SelfReported").addClass("active");
    $("#t3Safety").removeClass("active");
    $("#t3Impact").removeClass("active");
    $("#t3Support").removeClass("active");
    $("#allStaff").removeClass("active");

    tabPosition = 5;
  }

  if (tabPosition == 6){

    // Show end of second year image and hide others
    $("#all-content").hide();
    $("#t3Q-content").hide();
    $("#b3Q-content").hide();
    $("#t3Education-content").hide();      
    $("#t3Staff-content").hide();
    $("#t3SelfReported-content").hide();
    $("#t3Safety-content").show();
    $("#t3Impact-content").hide();
    $("#t3Support-content").hide();
    $("#allStaff-content").hide();

    // Make end of second year button active and all others inactive
    $("#all").removeClass("active");
    $("#t3Q").removeClass("active");
    $("#b3Q").removeClass("active");
    $("#t3Education").removeClass("active");
    $("#t3Staff").removeClass("active");
    $("#t3SelfReported").removeClass("active");
    $("#t3Safety").addClass("active");
    $("#t3Impact").removeClass("active");
    $("#t3Support").removeClass("active");
    $("#allStaff").removeClass("active");

    tabPosition = 6;
  }

  if (tabPosition == 7){

    // Show end of second year image and hide others
    $("#all-content").hide();
    $("#t3Q-content").hide();
    $("#b3Q-content").hide();
    $("#t3Education-content").hide();      
    $("#t3Staff-content").hide();
    $("#t3SelfReported-content").hide();
    $("#t3Safety-content").hide();
    $("#t3Impact-content").show();
    $("#t3Support-content").hide();
    $("#allStaff-content").hide();

    // Make end of second year button active and all others inactive
    $("#all").removeClass("active");
    $("#t3Q").removeClass("active");
    $("#b3Q").removeClass("active");
    $("#t3Education").removeClass("active");
    $("#t3Staff").removeClass("active");
    $("#t3SelfReported").removeClass("active");
    $("#t3Safety").removeClass("active");
    $("#t3Impact").addClass("active");
    $("#t3Support").removeClass("active");
    $("#allStaff").removeClass("active");

    tabPosition = 7;
  }

  if (tabPosition == 8){

    // Show end of second year image and hide others
    $("#all-content").hide();
    $("#t3Q-content").hide();
    $("#b3Q-content").hide();
    $("#t3Education-content").hide();      
    $("#t3Staff-content").hide();
    $("#t3SelfReported-content").hide();
    $("#t3Safety-content").hide();
    $("#t3Impact-content").hide();
    $("#t3Support-content").show();
    $("#allStaff-content").hide();

    // Make end of second year button active and all others inactive
    $("#all").removeClass("active");
    $("#t3Q").removeClass("active");
    $("#b3Q").removeClass("active");
    $("#t3Education").removeClass("active");
    $("#t3Staff").removeClass("active");
    $("#t3SelfReported").removeClass("active");
    $("#t3Safety").removeClass("active");
    $("#t3Impact").removeClass("active");
    $("#t3Support").addClass("active");
    $("#allStaff").removeClass("active");

    tabPosition = 8;
  }

  if (tabPosition == 9){

    // Show end of second year image and hide others
    $("#all-content").hide();
    $("#t3Q-content").hide();
    $("#b3Q-content").hide();
    $("#t3Education-content").hide();      
    $("#t3Staff-content").hide();
    $("#t3SelfReported-content").hide();
    $("#t3Safety-content").hide();
    $("#t3Impact-content").hide();
    $("#t3Support-content").hide();
    $("#allStaff-content").show();

    // Make end of second year button active and all others inactive
    $("#all").removeClass("active");
    $("#t3Q").removeClass("active");
    $("#b3Q").removeClass("active");
    $("#t3Education").removeClass("active");
    $("#t3Staff").removeClass("active");
    $("#t3SelfReported").removeClass("active");
    $("#t3Safety").removeClass("active");
    $("#t3Impact").removeClass("active");
    $("#t3Support").removeClass("active");
    $("#allStaff").addClass("active");

    tabPosition = 9;
  }



}

// This listens for key strokes and updates tab position based on the direction
// It then calls the tabPosition() function to update the content
document.addEventListener('keypress', (event) => {
const keyName = event.key;
if (keyName == "ArrowLeft"){
  tabPosition = tabPosition-1;
  if (tabPosition == -1){
    tabPosition = 3
  }
  switchTabs(tabPosition)
}
if (keyName == "ArrowRight"){
  tabPosition = tabPosition+1;
  if (tabPosition == 4){
    tabPosition = 0
  }
  switchTabs(tabPosition)
}
});

// Switching tabs with the gesture nav
$("#gesture-box-2").mousedown(function(event) {

  downX = event.pageX;
  downY = event.pageY;

}
);

$("#gesture-box-2").mouseup(function(event) {
  upX = event.pageX;
  upY = event.pageY;

    // Navigate to the left on a right swipe
  if ((upX - downX) > 20) {
    tabPosition = tabPosition-1;
    if (tabPosition == -1){
      tabPosition = 3
    }
    switchTabs(tabPosition)
  }
  // Navigate to the right on a left swipe
  else if ((upX - downX) < -20) {
    tabPosition = tabPosition+1;
    if (tabPosition == 4){
      tabPosition = 0
    }
    switchTabs(tabPosition)
  }

}
);