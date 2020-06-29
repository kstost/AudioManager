(function () {
   var root = this;
   var AudioManager = function (sound_resource, com_cb) {
      var pointer = this;
      if (sound_resource === undefined) { sound_resource = {} } //SAFE
      pointer.sound_resource = sound_resource;
      pointer.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      pointer.soundThread = {};
      pointer.uname = 'snd';
      pointer.ucnt = 0;
      if (Object.keys(sound_resource).length > 0) { //SAFE
         pointer.load_urls(com_cb);
      }
   };
   AudioManager.prototype = {
      stop: function (key_) {
         var pointer = this;
         var ll = [];
         for (var key in pointer.soundThread) {
            if (pointer.soundThread[key].key == key_) {
               ll.push(pointer.soundThread[key].source);
            }
         }
         for (var i = 0; i < ll.length; i++) {
            ll[i].stop();
         }
      },
      stop_by_pid: function (key_) {
         var pointer = this;
         var ll = [];
         for (var key in pointer.soundThread) {
            if (key == key_) {
               ll.push(pointer.soundThread[key].source);
            }
         }
         for (var i = 0; i < ll.length; i++) {
            ll[i].stop();
         }
      },
      add_url: function (url, key, com_cb) {
         var pointer = this;
         if (url.constructor.name === 'Array') {
            //SAFE
            com_cb = key;
            url.forEach(url_ => {
               pointer.sound_resource[url_] = url_;
            });
            pointer.load_urls(com_cb);
         } else {
            //SAFE
            if (key === undefined) { key = url; }
            pointer.sound_resource[key] = url;
            pointer.load_urls(com_cb);
         }
      },
      load_urls: function (com_cb) {
         //SAFE
         if (!com_cb) {
            com_cb = () => { }
         }
         var pointer = this;
         var url_list = [];
         var cb_count = 0;
         var err_count = [];
         var check_done = function () {
            if (url_list.length == cb_count) {
               com_cb(err_count.length ? err_count : null);
            }
         };
         for (var key in pointer.sound_resource) {
            if (typeof pointer.sound_resource[key] == 'string') {
               url_list.push(key);
            }
         }
         if (url_list.length > 0) {
            for (var i = 0; i < url_list.length; i++) {
               pointer.audio_to_b64(url_list[i], function (base64, err, url, key) {
                  cb_count++;
                  if (err) {
                     delete pointer.sound_resource[key]; //SAFE
                     err_count.push({
                        err: err,
                        url: url,
                        key: key
                     });
                  } else {
                     pointer.sound_resource[key] = {
                        url: url,
                        base64: base64
                     };
                  }
                  check_done();
               });
            }
         } else {
            com_cb(null);
         }
      },
      extract_all: function (cb) {
         var pointer = this;
         var count = Object.keys(pointer.sound_resource).length;
         var cb_ = function (buffer) {
            if (buffer) {
               count--;
               if (count <= 0) {
                  cb();
               }
            }
         };
         for (var sori_key in pointer.sound_resource) {
            pointer.extract_sound(sori_key, cb_);
         }
      },
      grant_permission: function () {
         //SAFE
         if (true || this.audioCtx.state === 'suspended') {
            this.play();
         }
      },
      play: function (sound_name, ecb) {
         var pointer = this;
         if (sound_name === undefined) {
            sound_name = 'grant_key';
            this.permission = true;
         }
         pointer.extract_sound(sound_name, function (ar) {
            if (ar.play && pointer.permission) {
               ar.play(ecb);
            }
         });
      },
      //SAFE
      isLoaded: function (key) {
         let pointer = this;
         if (pointer.sound_resource[key]) {
            return pointer.sound_resource[key].constructor.name === 'Object';
         }
         return false;
      },
      isLoading: function (key) {
         let pointer = this;
         if (pointer.sound_resource[key]) {
            return pointer.sound_resource[key].constructor.name !== 'Object';
         }
         return false;
      },
      //SAFE
      run: function (url, ecb) {
         let pointer = this;
         if (pointer.audioCtx.state === 'suspended') {
            pointer.grant_permission();
         }
         if (pointer.isLoaded(url)) {
            this.play(url, ecb);
         } else if (pointer.isLoading(url)) {
         } else {
            pointer.add_url(url, url, (err) => {
               if (!(err && err.filter(row => row.url === url).length)) {
                  this.play(url, ecb);
               } else {
                  if (ecb && ecb.error) {
                     ecb.error();
                  }
               }
            });
         }
      },
      audio_to_b64: function (key, cb) {
         var pointer = this;
         var url = pointer.sound_resource[key];
         var request = new XMLHttpRequest();
         request.open('GET', url, true);
         request.responseType = 'arraybuffer';
         //SAFE
         request.onerror = function () {
            cb(null, 'network fail', url, key);
         };
         request.onload = function () {
            if (request.status == 200) {
               pointer.audioCtx.decodeAudioData(request.response, function (buffer) {
                  var source = pointer.audioCtx.createBufferSource();
                  source.buffer = buffer;
                  var UintWave = AudioManager.createWaveFileData(buffer);
                  var base64 = btoa(AudioManager.uint8ToString(UintWave));
                  cb(base64, null, url, key);
               }, function (e) {
                  cb(null, e, url, key);
               });
            } else {
               cb(null, request.statusText, url, key);
            }
         }
         request.send();
      },
      extract_sound: function (name, cb) {
         var pointer = this;
         var cb_exe = false;
         if (!pointer.isLoaded(name) && !pointer.isLoading(name) && name === 'grant_key') { //SAFE
            pointer.sound_resource[name] = {};
            var channels = 2;
            var frameCount = pointer.audioCtx.sampleRate * 0.00003;
            var myArrayBuffer = pointer.audioCtx.createBuffer(channels, frameCount, pointer.audioCtx.sampleRate);
            for (var channel = 0; channel < channels; channel++) {
               var nowBuffering = myArrayBuffer.getChannelData(channel);
               for (var i = 0; i < frameCount; i++) {
                  nowBuffering[i] = Math.random() * 2 - 1;
               }
            }
            pointer.sound_resource[name].buffer = myArrayBuffer;
         }
         if (pointer.isLoaded(name)) { //SAFE
            if (!pointer.sound_resource[name].play) {
               pointer.sound_resource[name].play = function (ecb) {
                  pointer.ucnt++;
                  var pid = pointer.uname + '-' + pointer.ucnt;
                  var source = pointer.audioCtx.createBufferSource();
                  pointer.soundThread[pid] = {
                     key: name,
                     source: source
                  };
                  var sdt = {
                     resource_info: pointer.soundThread[pid],
                     pid: pid,
                     source: source
                  };
                  source.buffer = this.buffer;
                  //SAFE
                  var gainNode = this.audioCtx.createGain();
                  source.connect(gainNode);
                  gainNode.connect(this.audioCtx.destination);
                  gainNode.gain.value = name === 'grant_key' ? 0 : 1;
                  let startTime = this.audioCtx.currentTime;
                  let raf = (function (callback) {
                     return window.requestAnimationFrame ||
                        window.webkitRequestAnimationFrame ||
                        window.mozRequestAnimationFrame ||
                        window.oRequestAnimationFrame ||
                        window.msRequestAnimationFrame ||
                        function (callback) { window.setTimeout(callback, 1000 / 60); };
                  })();
                  let recur_ = () => {
                     if (pointer.soundThread[pid]) {
                        let spent = (this.audioCtx.currentTime - startTime);
                        let keep = true;
                        if (ecb && ecb.playtime) {
                           if (ecb.playtime / 1000 <= spent) {
                              keep = false;
                           }
                        }
                        if (spent > 0 && ecb && ecb.start) {
                           ecb.start(sdt);
                           delete ecb.start;
                        }
                        if (ecb && ecb.progress && !ecb.start) {
                           let ratio = spent / source.buffer.duration;
                           if (ratio > 1) { ratio = 1; }
                           ecb.progress(sdt, ratio);
                        }
                        if (keep) {
                           raf(recur_);
                        } else {
                           pointer.stop_by_pid(pid);
                        }
                     }
                  }
                  source.onended = function () {
                     //SAFE
                     if (ecb && ecb.progress) {
                        ecb.progress(sdt, 1);
                     }
                     delete pointer.soundThread[pid];
                     if (ecb && ecb.end) {
                        ecb.end(sdt);
                     }
                  };
                  source.start();
                  recur_();
               };
               pointer.sound_resource[name].audioCtx = pointer.audioCtx;
               if (!pointer.sound_resource[name].buffer) {
                  cb_exe = true;
                  pointer.audioCtx.decodeAudioData(AudioManager._base64ToArrayBuffer(pointer.sound_resource[name].base64), function (buffer) {
                     pointer.sound_resource[name].buffer = buffer;
                     delete pointer.sound_resource[name].base64;
                     cb(pointer.sound_resource[name]);
                  }, function (err) { //SAFE
                     delete pointer.sound_resource[name];
                  });
               }
            }
         }
         if (!cb_exe) {
            cb(pointer.sound_resource[name]);
         }
      },
   };
   root.AudioManager = AudioManager;
   root.AudioManager.createWaveFileData = function (audioBuffer) {
      var frameLength = audioBuffer.length;
      var numberOfChannels = audioBuffer.numberOfChannels;
      var sampleRate = audioBuffer.sampleRate;
      var bitsPerSample = 16;
      var byteRate = sampleRate * numberOfChannels * bitsPerSample / 8;
      var blockAlign = numberOfChannels * bitsPerSample / 8;
      var wavDataByteLength = frameLength * numberOfChannels * 2; // 16-bit audio
      var headerByteLength = 44;
      var totalLength = headerByteLength + wavDataByteLength;
      var waveFileData = new Uint8Array(totalLength);
      var subChunk1Size = 16; // for linear PCM
      var subChunk2Size = wavDataByteLength;
      var chunkSize = 4 + (8 + subChunk1Size) + (8 + subChunk2Size);
      AudioManager.writeString("RIFF", waveFileData, 0);
      AudioManager.writeInt32(chunkSize, waveFileData, 4);
      AudioManager.writeString("WAVE", waveFileData, 8);
      AudioManager.writeString("fmt ", waveFileData, 12);
      AudioManager.writeInt32(subChunk1Size, waveFileData, 16);      // SubChunk1Size (4)
      AudioManager.writeInt16(1, waveFileData, 20);                  // AudioFormat (2)
      AudioManager.writeInt16(numberOfChannels, waveFileData, 22);   // NumChannels (2)
      AudioManager.writeInt32(sampleRate, waveFileData, 24);         // SampleRate (4)
      AudioManager.writeInt32(byteRate, waveFileData, 28);           // ByteRate (4)
      AudioManager.writeInt16(blockAlign, waveFileData, 32);         // BlockAlign (2)
      AudioManager.writeInt32(bitsPerSample, waveFileData, 34);      // BitsPerSample (4)
      AudioManager.writeString("data", waveFileData, 36);
      AudioManager.writeInt32(subChunk2Size, waveFileData, 40);      // SubChunk2Size (4)
      // Write actual audio data starting at offset 44.
      AudioManager.writeAudioBuffer(audioBuffer, waveFileData, 44);
      return waveFileData;
   };
   root.AudioManager.writeString = function (s, a, offset) {
      for (var i = 0; i < s.length; ++i) {
         a[offset + i] = s.charCodeAt(i);
      }
   };
   root.AudioManager.writeInt16 = function (n, a, offset) {
      n = Math.floor(n);
      var b1 = n & 255;
      var b2 = (n >> 8) & 255;
      a[offset + 0] = b1;
      a[offset + 1] = b2;
   };
   root.AudioManager.writeInt32 = function (n, a, offset) {
      n = Math.floor(n);
      var b1 = n & 255;
      var b2 = (n >> 8) & 255;
      var b3 = (n >> 16) & 255;
      var b4 = (n >> 24) & 255;
      a[offset + 0] = b1;
      a[offset + 1] = b2;
      a[offset + 2] = b3;
      a[offset + 3] = b4;
   };
   root.AudioManager.writeAudioBuffer = function (audioBuffer, a, offset) {
      var n = audioBuffer.length;
      var channels = audioBuffer.numberOfChannels;
      for (var i = 0; i < n; ++i) {
         for (var k = 0; k < channels; ++k) {
            var buffer = audioBuffer.getChannelData(k);
            var sample = buffer[i] * 32768.0;

            // Clip samples to the limitations of 16-bit.
            // If we don't do this then we'll get nasty wrap-around distortion.
            if (sample < -32768)
               sample = -32768;
            if (sample > 32767)
               sample = 32767;

            AudioManager.writeInt16(sample, a, offset);
            offset += 2;
         }
      }
   };
   root.AudioManager.uint8ToString = function (buf) {
      var i, length, out = '';
      for (i = 0, length = buf.length; i < length; i += 1) {
         out += String.fromCharCode(buf[i]);
      }
      return out;
   };
   root.AudioManager._base64ToArrayBuffer = function (base64) {
      var binary_string = window.atob(base64);
      var len = binary_string.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
         bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes.buffer;
   };
}).call(this);
