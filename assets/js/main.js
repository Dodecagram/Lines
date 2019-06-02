---

---
let files = [];
const filetree = {_name: 'root', _files: [], _children: [], _parent: null};
let cursor = new Object();
const domain = '{{ site.data.config.domain }}';
const base = '{{ site.data.config.base }}';
let path_now = location.pathname.slice(base.length);
const searchPath = function(){
	let _cursor = filetree;
	let path_arr = path_now.split('/')
	if(path_arr[0] == '') path_arr = path_arr.slice(1);
	if(path_arr[path_arr.length - 1] == '') path_arr.pop();
	path_arr = path_arr.reverse();
	let path;
	while(path = path_arr.pop()){
		let idx = _cursor._children.map(x=>x._name).indexOf(path);
		if(idx == -1){
			return false;
		}else{
			_cursor = _cursor._children[idx];
		}
	}
	if(_cursor._name == 'root') _cursor = filetree._children[filetree._children.map(x=>x._name).indexOf('files')];
	return _cursor;
}
const formFiletree = function(files){
	return new Promise((resolve)=>{
		let files_sort = files.map((file, idx)=>[file[0], idx]).sort();
		let file_list = files_sort.map(file=>file[0].split('/').slice(1));
		for(let i in file_list){
			let cursor = filetree;
			for(let j in file_list[i]){
				if(j != file_list[i].length - 1){
					let dirs_name = new Set(cursor._children.map(dirs=>dirs._name));
					let dirs_num = dirs_name.size;
					dirs_name.add(file_list[i][j]);
					if(dirs_name.size > dirs_num){
						let dir = {};
						Object.assign(dir, filetree);
						dir._name = file_list[i][j];
						dir._parent = cursor;
						dir._files = new Array();
						dir._children = new Array();
						cursor._children.push(dir);
					}
					cursor._children.slice().forEach(dir=>{
						if(dir._name == file_list[i][j]){
							cursor = dir;
						}
					});
				}else{
					cursor._files.push(files_sort[i][1]);
				}
			}
		}
		resolve(filetree);
	});
};
const formDirlist = function(dir){
	let list = document.createElement('li');
	let link = document.createElement('a');
	link.href = path_now + dir._name;
	link.innerText = dir._name;
	link.onclick = function(e){
		e.preventDefault();
		cursor = dir;
		formPage();
	};
	list.appendChild(link);
	return list;
};
const formFilelist = function(file){
	let filename = files[file][0].match(/[^\/]+?$/)[0];
	let filehref = files[file][0].slice(1);
	let fileext = /\./.test(filename)?filename.match(/\.[^\.]*$/)[0]:false;
	if(filename == 'notice'){
		fetch(filehref).then(res=>res.text()).then(res=>{
			document.querySelector('#note pre').innerText = res;
		});
		return false;
	}
	let list = document.createElement('li');
	let link = document.createElement('a');
	let time_span = document.createElement('span');
	link.href = filehref;
	link.innerText = filename;
	time_span.innerText = files[file][1];
	list.appendChild(link);
	list.appendChild(time_span);
	let icons = document.createElement('span');
	let download_icon = document.createElement('a');
	download_icon.classList.add('icon', 'download');
	download_icon.download = filename;
	download_icon.href = filehref;
	download_icon.title = 'Download';
	icons.appendChild(download_icon);
	switch(fileext){
		case '.doc':case '.docx':case '.ppt':case 'pptx':
			let view_icon = document.createElement('a');
			view_icon.title = 'View';
			view_icon.classList.add('ico', 'view');
			view_icon.onclick = function(e){
				let pre_link = 'https://view.officeapps.live.com/op/view.aspx?src=';
				window.open(pre_link+domain+base+filehref);
			}
			icons.appendChild(view_icon);
			break;
		case '.mp4':case '.mkv':case 'avi':
			let video_icon = document.createElement('a');
			video_icon.title = 'Play';
			video_icon.classList.add('ico', 'play');
			video_icon.onclick = function(e){
				window.open('video?src='+filehref);
			}
			icons.appendChild(video_icon);
			break;
		case '.jpg':case '.png':case 'jpeg':case '.gif':
			let viewpic_icon = document.createElement('a');
			viewpic_icon.title = 'View';
			viewpic_icon.classList.add('ico', 'viewpic');
			viewpic_icon.onclick = function(e){
				let idx = file;
				let pic_list = [];
				cursor._files.forEach(pic=>{
					if(/\.(jpg|jpeg|png|gif)$/.test(files[pic][0])){
						pic_list.push(pic);
					}
				});
				showPics(pic_list, idx);
			}
			icons.appendChild(viewpic_icon);
			break;
		case '.mp3':case '.wav':case '.ogg':
			let audio_icon = document.createElement('a');
			audio_icon.title = 'Play';
			audio_icon.classList.add('ico', 'play');
			audio_icon.onclick = function(e){
				let idx = file;
				let audio_list = [];
				cursor._files.forEach(aud=>{
					if(/\.(mp3|wav|ogg)$/.test(files[aud][0])){
						audio_list.push(aud);
					}
				});
				playAudio(audio_list, idx);
			}
			icons.appendChild(audio_icon);
			break;
		default:
			break;
	       };
	list.appendChild(icons);
	return list;
};
const playAudio = function(audio_list, idx){
	formAudioList(audio_list.map(x=>files[x][0].slice(1)), audio_list.indexOf(idx));
	document.querySelector('#widget .audioWindow').classList.toggle('hidden', false);
}
const showPics = function(pic_list, idx){
	PicList = pic_list.map(x=>files[x][0].slice(1));
	PicIdx = pic_list.indexOf(idx);
	PicProgress.innerHTML = (PicIdx+1) + '/' + PicList.length;
	document.querySelector('#widget .mask').classList.toggle('hidden', false);
	document.querySelector('#widget .mask .pic img').src = PicList[PicIdx];
}
const formBacklist = function(){
	let list = document.createElement('li');
	let link = document.createElement('a');
	link.href = path_now.match(/(^.*\/)[^\/]+\/$/)[1];
	link.innerText = '..';
	link.onclick = function(e){
		e.preventDefault();
		cursor = cursor._parent
		formPage();
	};
	list.appendChild(link);
	return list;
}
const getHref = function(obj){
	let path = '/';
	let _cursor = obj;
	while(_cursor._name != 'root'){
		path = '/' + _cursor._name + path;
		_cursor = _cursor._parent;
	}
	return path.slice(1);
};
const formPage = function(){
	document.querySelector('#note pre').innerText = '';
	let nav0 = document.querySelector('main>nav');
	let path_arr = [];
	let _cursor = cursor._parent;
	while(_cursor._name != 'root'){
		path_arr.push(_cursor);
		_cursor = _cursor._parent;
	}
	let path;
	let nav = document.createElement('nav');
	while(path = path_arr.pop()){
		if(path._name == 'root') break;
		let link = document.createElement('a');
		link.href = getHref(path);
		link.innerText = path._name;
		let xxxtest = path;
		link.onclick = function(e){
			e.preventDefault()
			cursor = xxxtest;
			formPage();
		}
		nav.appendChild(document.createTextNode('/'));
		nav.appendChild(link);
	}
	nav.appendChild(document.createTextNode('/' + cursor._name));
	path_now = nav.innerText + '/';
	path_now = path_now.slice(1);
	history.replaceState(null, path_now, '/' + base + path_now);
	document.querySelector('main').replaceChild(nav, nav0);
	let ulist = document.createElement('ul');
	//formBacklist(cursor)
	//cursor._children.forEach dir->formDirlist(dir)
	//cursor._files.forEach file->formFilelist(file)
	if(cursor._name != 'files') ulist.appendChild(formBacklist());
	cursor._children.forEach(dir=>{
		ulist.appendChild(formDirlist(dir));
	});
	cursor._files.forEach(file=>{
		let filenode = formFilelist(file);
		if(filenode) ulist.appendChild(filenode);
	});
	document.querySelector('#dirs').replaceChild(ulist, document.querySelector('#dirs>ul'));
};
const initPage = function(filetree){
	cursor = searchPath()
	if(cursor){
		formPage();
	}
	else{
		document.write(`{{ site.data.config.ui.Page404 }}`);
	}
};


fetch("assets/form_path", {
	method: 'get',
	headers: {
		'Content-Type': 'application/json'
	}
})
.then(res=>res.json())
.then(filelist=>{
	files = filelist;
	return formFiletree(files);
})
.then(filetree=>initPage(filetree));

