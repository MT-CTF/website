export const redisSTATKEYS = [
	"score",
	"kills",
	"deaths",
	"kill_assists",
	"bounty_kills",
	"flag_captures",
	"flag_attempts",
	"hp_healed",
	"reward_given_to_enemy",
];

export const MODES = ["ctf_mode_classes", "ctf_mode_classic", "ctf_mode_nade_fight"];

/**
 * Return a humanreadable name from a technical name
 *
 * eg: `nade_fight` -> `Nade Fight`
 */
export function technicalToName(technical_name) {
	if (technical_name.substring(0, 9) == "ctf_mode_") technical_name = technical_name.substring(9);

	return technical_name
		.split("_")
		.map((word) => {
			return word[0].toUpperCase() + word.substring(1);
		})
		.join(" ");
}
