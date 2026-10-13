import fs from 'fs';
import os from 'os';
import path from 'path';
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// On the author's Windows machine the bundled ffmpeg.exe is blocked by the integrity policy,
// and ffmpeg also fails when its folder path contains non-ASCII characters ("klasör").
// There the binaries live in an ASCII-only folder, with ffmpeg.exe swapped for the
// imageio-ffmpeg build (see README). Everywhere else Remotion's own binaries are used.
const BIN_DIR = path.join(os.homedir(), '.remotion-bin');
if (fs.existsSync(BIN_DIR)) {
  Config.setBinariesDirectory(BIN_DIR);
}
