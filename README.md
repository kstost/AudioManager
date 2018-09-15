# AudioManager
### 초기화
아래와 같이 미리 리소스를 로드하여 오디오매니저를 생성합니다.
음원리소스의 URL을 넣을수도 있고, 음원바이너리를 BASE64로 인코딩한 문자열을 포함시킬 수 있습니다.
URL 로 넣을 경우에는 아래 코드를 호출하는 페이지로부터 AJAX 통신이 가능한 URL이여야 합니다.
초기화 처리가 완료되면 콜백으로 알려줍니다. 에러가 없다면 err 는 null, 있다면 err 는 배열이고 각 요소는 로드 실패한 자료의 정보입니다.
```
var am = new AudioManager({
   voic: { base64: 'UklGRiT8AABXQVZFZm10IBAAAAABA...' },
   ring: '/resource/sound2.mp3'
}, function (err) {
   if (!err) {
      console.log('모든 리소스 로드 완료');
   } else {
      console.log('다음 건들에 대해서 로드 실패');
      console.log(err);
   }
});
```
참고로 BASE64 로 음원을 인코딩하는 방법은 아래와 같습니다.
openssl base64 < sound.mp3 | tr -d '\n' > base64_encoded_binary.txt
base64_encoded_binary.txt 의 내용을 열어보면 인코딩 된 문자열이 들어가있는것을 확인 할 수 있습니다.

### 권한부여
이 부분이 중요합니다.

```
button.addEventListener("click", function(){
   am.grant_permission();
});
```

### 음원 재생
같은 리소스에 대해서 중복 재생이 가능하며 다른 리소스와도 중복 재생이 가능합니다.
```
am.play('ring');
```

### 음원 재생
두번째 인자로 콜백 함수를 줄 수 있습니다

```
am.play('ring', {
   start:function(task) {
      console.log('재생이 시작되었습니다');
      console.log('재생건의 PID는 '+task.pid+'입니다');
      console.log('재생건의 리소스 이름은 '+task.resource_info.key+'입니다');
      console.log('재생건의 재생시간은 '+task.source.buffer.duration+'입니다');
      console.log(task);
   },
   end:function(task) {
      console.log('재생이 종료되었습니다');
      console.log(task);
   }
});
```

### 리소스 이름으로 정지
인자로 준 리소스 이름에 해당하는 모든 재생이 정지됩니다.
```
am.stop('ring');
```

### PID 이름으로 정지
해당 PID 에 해당하는 재생건을 정지합니다.

```
am.stop_by_pid('snd-31');
```

### 음원의 추가
```
am.add_url('/resource/sound2.mp3', 'newone', function (err){
   console.log('음원추가 완료');
   console.log(err);
   am.play('newone');
});
```
