const { exec } = require("child_process");

module.exports = function convertHDR(input, output) {
  return new Promise((resolve, reject) => {
    const command = `
      ffmpeg -y -i "${input}" \
        -c:v libx265 -pix_fmt yuv420p10le \
        -color_primaries bt2020 \
        -color_trc arib-std-b67 \
        -colorspace bt2020nc \
        -x265-params "colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc" \
        -c:a copy \
        "${output}"
    `;

    exec(command, (error, stdout, stderr) => {
      if (error) return reject(stderr);
      resolve(stdout);
    });
  });
};
