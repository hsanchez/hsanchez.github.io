require 'rubygems'
require 'rake'

desc 'Run jekyll'
task :preview do
  `jekyll serve --watch`
end

desc 'Clean up generated site'
task :clean do
  cleanup
end

def cleanup
  sh 'rm -rf _site'
end
