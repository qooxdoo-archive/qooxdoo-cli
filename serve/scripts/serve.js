$(function() {
  
  function get(uri) {
    return new Promise((resolve, reject) => {
      $.ajax("/serve.api/apps.json", {
        cache: false,
        dataType: "json",
        
        error: function(jqXHR, textStatus, errorThrown) {
          reject(textStatus || errorThrown);
        },
        
        success: resolve
      });
    });
  }
  
  get("/serve-api/apps")
    .then((data) => {
      console.log(JSON.stringify(data, null, 2));
    });
});

