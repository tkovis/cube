deploy:
	ssh root@cube.tkovis.com 'cd cube; git checkout .; git pull; npm run build; npm run prod';