import Gun, { GunCallbackUserAuth, GunCallbackUserCreate } from 'gun';
import SEA from "gun/sea";
import { useEffect, useState } from 'react';
import './App.css';

type UserCreate = Parameters<GunCallbackUserCreate>[0];
type UserAuth = Parameters<GunCallbackUserAuth>[0];
interface Err {
  err: string;
}

const isErr = (response: unknown): response is Err => {
  return typeof (response as Err).err === 'string';
}

const gun = Gun(['https://gun-manhattan.herokuapp.com/gun']);
const user = gun.user().recall({ sessionStorage: true });

console.log(SEA);

function App() {
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [say, setSay] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [saidRecord, setSaidRecord] = useState<Record<string, string>>({});

  const onSaid = (data: unknown, key: string) => {
    // console.log({key, data});
    const payload = data as { say: string };
    setSaidRecord((prev) => ({ ...prev, [key]: payload.say }))
    // SEA.decrypt(data as string, { epriv: privateKey.current }).then((val) => console.log('dec: ' + JSON.stringify(val)));
  }

  useEffect(() => {
    if (!user.is) {
      return;
    }
    console.log(JSON.stringify(user.is));
    user.get('_said_').map().on(onSaid);
  }, [])

  const onUserCreate = (ack: UserCreate) => {
    console.log(ack);
  };

  const onUserAuth = (ack: UserAuth) => {
    if (isErr(ack)) {
      return;
    }
    user.get('_said_').map().on(onSaid);
    setSignedIn(true);
  };

  const handleSubmit = (sign: 'in' | 'up') => {
    if (sign === 'up') {
      user.create(name, pass, onUserCreate)
      return;
    }
    user.auth(name, pass, onUserAuth)
  }

  const sayIt = () => {
    console.log('I said: ' + say);
    user.get('_said_').set({ say });
  }

  useEffect(() => {
    if (signedIn) {
      console.log('here ' + user.is)
    }
  }, [signedIn])

  return (
    <>
      <h1>Ganja</h1>
      <p>Auth? {user.is ? 'yes' : 'no'}</p>
      {user.is ?
        <div>
          <h3>Signed in as {user.is.alias.toString()}</h3>
          <input id="say" placeholder="Say..." value={say} onChange={(e) => setSay(e.target.value)} />
          <button onClick={() => sayIt()} >
            Say
          </button>
          <h4>Said:</h4>
          <ul>
            {Object.entries(saidRecord).map(([key, value]) => (
              <li key={key}>
                {key}: {value}
              </li>
            ))}
          </ul>
        </div> :
        <div>
          <form id="sign">
            <h3>Sign Up/Sign In</h3>
            <input id="alias" placeholder="username" autoComplete='username' value={name} onChange={(e) => setName(e.target.value)} />
            <input id="pass" type="password" autoComplete='current-password' placeholder="passphrase" value={pass} onChange={(e) => setPass(e.target.value)} />
            <input id="in" type="button" name="submitButton" value="sign in" onClick={() => handleSubmit('in')} />
            <input id="up" type="button" name="submitButton" value="sign up" onClick={() => handleSubmit('up')} />
          </form>
        </div>}
    </>
  )
}

export default App
