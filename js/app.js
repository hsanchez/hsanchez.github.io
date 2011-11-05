var GitHub = {
  repos : function(username, callback) {
    var url = "http://github.com/api/v2/json/repos/show/" + username + "?callback=?";
    $.getJSON(url, function(data) {
      callback(data.repositories);
    });
  },
  repo: function(username, reponame, callback) {
    var url = "http://github.com/api/v2/json/repos/show/" + username + "/" + reponame + "?callback=?";
    $.getJSON(url, callback);
  }
};

var Repo = {
  data: null,
  view: function() {
    return '' +
    '<div class="grid_4">' +
      this.title() +
      this.subtitle() +
      this.description() +
    '</div>';
  },
  title: function() {
    return '<h4><a href="' + this.data.url + '">' + this.data.name + '</a></h4>';
  },
  subtitle: function() {
    return '<h5>' + this.data.watchers + ' watcher' + ( this.data.watchers == 1 ? '' : 's' ) + '</h5>';
  },
  description: function() {
    return '<p>' + this.data.description + '</p>';
  }
};

var MyRepos = {
  init: function(callback) {
     $("body").prepend('<div id="repos-wrapper" class="clearfix"><div id="repos" class="container_12"></div></div>');
     this.container = $("#repos");
     this.container.hide();

    GitHub.repos('hsanchez', function(repositories) {
      // console.log(repositories);

      var repos = _.reject(repositories, function(r) {
        return r.fork || r.name == "hsanchez.github.com";
      });

      repos = _.sortBy(repos, function(r) {
        return r.pushed_at;
      }).reverse();

       for (var i=0; i < repos.length; i++) {
         var repo  = Object.create(Repo);
         repo.data = repos[i];

         // GitHub.repo('hsanchez', repo.data.name, function(d) {
         //   console.log(d);
         // });

         MyRepos.container.append( repo.view() );

         if ( (i + 1) % 3 == 0) MyRepos.container.append('<hr />');
       };
    });
  }
};

$(document).ready(function() {
  MyRepos.init();

  $("#github-repos").click( function() {
    MyRepos.container.slideToggle();
    $('html, body').animate({scrollTop:0}, 'slow');
    return false;
  });
});
