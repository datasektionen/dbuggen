task default: %w[serve]

task :serve do
  sh "bundle exec jekyll serve -w"
end

namespace :assets do
  task :precompile do
    puts `bundle exec jekyll build`
  end
end
