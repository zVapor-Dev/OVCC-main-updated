import assert from "node:assert/strict";
import test from "node:test";
import {
  groupByRole,
  memberRow,
  parseDiscordRoleId,
  planMemberSync,
  planRoleMapping,
  rolesFromMembers,
  tmpDate,
  vtcInfo,
  vtcMembers,
  vtcRoles,
} from "../lib/tmp-vtc";

const owner = { id: 256342, name: "Owner", order: 0, color: "#ffbe00", owner: true };
const events = { id: 262632, name: "Event Team", order: 1, color: "#1e4c94" };

test("VTC info maps stats, games and recruitment from the TruckersMP profile", () => {
  const vtc = vtcInfo({
    id: 87827,
    name: "Orvion Convoy Control",
    tag: "Orvion | CC",
    logo: "https://static.truckersmp.com/logo.png",
    games: { ats: false, ets: true },
    members_count: 12,
    recruitment: "Close",
    verified: false,
    validated: true,
    languages: ["English", 3],
    created: "2026-03-16 13:29:04",
  });
  assert.ok(vtc);
  assert.deepEqual(vtc.games, ["ETS2"]);
  assert.equal(vtc.membersCount, 12);
  assert.equal(vtc.recruitment, "Closed");
  assert.equal(vtc.recruitmentOpen, false);
  assert.equal(vtc.validated, true);
  assert.deepEqual(vtc.languages, ["English"]);
  assert.equal(vtc.created?.toISOString(), "2026-03-16T13:29:04.000Z");
  assert.equal(vtcInfo({ recruitment: "Open", id: 1, name: "X" })?.recruitmentOpen, true);
  assert.equal(vtcInfo({ name: "No id" }), null);
  assert.equal(vtcInfo([]), null);
});

test("TruckersMP dates are read as UTC and junk is rejected", () => {
  assert.equal(tmpDate("2026-03-16 13:29:05")?.toISOString(), "2026-03-16T13:29:05.000Z");
  assert.equal(tmpDate("2026-13-45 99:00:00"), null);
  assert.equal(tmpDate("yesterday"), null);
  assert.equal(tmpDate(null), null);
});

test("members keep the exact steam ID string, link to TruckersMP profiles and drop invalid rows", () => {
  const members = vtcMembers({
    members: [
      {
        user_id: 6189599,
        username: "Orvion Convoy Control",
        avatar: "https://static.truckersmp.com/avatarsN/6189599.png",
        steam_id: 76561198732095532,
        steamID: "76561198732095532",
        role_id: 256342,
        role: "Owner",
        joinDate: "2026-03-16 13:29:05",
      },
      { user_id: 6189599, username: "Duplicate" },
      { user_id: "abc", username: "Bad id" },
      { user_id: 5, username: "" },
      { user_id: 7, username: "Driver", avatar: "javascript:alert(1)", steamID: "nope" },
      null,
    ],
  });
  assert.ok(members);
  assert.equal(members.length, 2);
  assert.equal(members[0].steamId, "76561198732095532");
  assert.equal(members[0].profileUrl, "https://truckersmp.com/user/6189599");
  assert.equal(members[0].joinedAt?.toISOString(), "2026-03-16T13:29:05.000Z");
  assert.equal(members[1].avatar, undefined);
  assert.equal(members[1].steamId, null);
  assert.equal(members[1].roleId, null);
  assert.equal(vtcMembers({ nope: [] }), null);
});

test("roles are sorted by TruckersMP order and can be recovered from member payloads", () => {
  assert.deepEqual(
    vtcRoles({ roles: [events, owner, { id: 0, name: "bad" }] })?.map((r) => r.name),
    ["Owner", "Event Team"],
  );
  assert.equal(vtcRoles({ roles: [{ ...owner, color: "red;" }] })?.[0].color, undefined);
  assert.equal(vtcRoles("x"), null);
  assert.deepEqual(
    rolesFromMembers({ members: [{ roles: [events] }, { roles: [owner, events] }] }).map((r) => r.id),
    [owner.id, events.id],
  );
});

test("members are grouped by role order, unknown roles last, names sorted", () => {
  const members = vtcMembers({
    members: [
      { user_id: 1, username: "zed", role_id: events.id, role: "Event Team" },
      { user_id: 2, username: "amy", role_id: events.id, role: "Event Team" },
      { user_id: 3, username: "boss", role_id: owner.id, role: "Owner" },
      { user_id: 4, username: "new", role_id: 999, role: "Trainee" },
    ],
  })!;
  const groups = groupByRole(members, vtcRoles({ roles: [owner, events] })!);
  assert.deepEqual(
    groups.map((g) => [g.role.name, g.members.map((m) => m.username)]),
    [
      ["Owner", ["boss"]],
      ["Event Team", ["amy", "zed"]],
      ["Trainee", ["new"]],
    ],
  );
});

test("Discord role IDs must be 17-20 digit snowflakes; empty means remove", () => {
  assert.equal(parseDiscordRoleId(" 123456789012345678 "), "123456789012345678");
  assert.equal(parseDiscordRoleId("12345678901234567"), "12345678901234567");
  assert.equal(parseDiscordRoleId(""), null);
  assert.equal(parseDiscordRoleId("   "), null);
  assert.equal(parseDiscordRoleId(null), null);
  for (const bad of ["1234", "123456789012345678901", "12345678901234567a", "-12345678901234567", "<@&123456789012345678>", "00000000000000000"])
    assert.equal(parseDiscordRoleId(bad), undefined, bad);
  assert.equal(parseDiscordRoleId({}), undefined);
});

test("role mapping plans only real changes for known roles and reports invalid input", () => {
  const roles = vtcRoles({ roles: [owner, events] })!;
  const current = [
    { tmpRoleId: owner.id, tmpRoleName: "Owner", discordRoleId: "111111111111111111" },
    { tmpRoleId: 42, tmpRoleName: "Old rank", discordRoleId: "222222222222222222" },
  ];
  const plan = planRoleMapping(
    [
      ["role:256342", "111111111111111111"], // unchanged
      ["role:262632", "333333333333333333"], // new
      ["role:42", ""], // removed (orphan mapping still editable)
      ["role:7", "444444444444444444"], // unknown role: ignored
      ["$ACTION_ID_x", "whatever"],
    ],
    roles,
    current,
  );
  assert.deepEqual(plan.invalid, []);
  assert.deepEqual(plan.changes, [
    { tmpRoleId: events.id, tmpRoleName: "Event Team", discordRoleId: "333333333333333333" },
    { tmpRoleId: 42, tmpRoleName: "Old rank", discordRoleId: null },
  ]);
  assert.deepEqual(planRoleMapping([["role:262632", "nope"]], roles, current).invalid, [events.id]);
  assert.deepEqual(planRoleMapping([["role:262632", ""]], roles, current).changes, []);
  // A renamed TMP rank refreshes the stored name even when the Discord role is unchanged.
  const renamed = vtcRoles({ roles: [{ ...owner, name: "Founder" }] })!;
  assert.deepEqual(planRoleMapping([["role:256342", "111111111111111111"]], renamed, current).changes, [
    { tmpRoleId: owner.id, tmpRoleName: "Founder", discordRoleId: "111111111111111111" },
  ]);
});

test("member sync removes users who left and never writes discordId", () => {
  const members = vtcMembers({ members: [{ user_id: 1, username: "a" }, { user_id: 2, username: "b" }] })!;
  const plan = planMemberSync(members, [1, 3, 4]);
  assert.deepEqual(
    plan.upsert.map((m) => m.userId),
    [1, 2],
  );
  assert.deepEqual(plan.remove, [3, 4]);
  const row = memberRow(members[0], new Date(0));
  assert.equal("discordId" in row, false);
  assert.deepEqual(Object.keys(row).sort(), ["joinedAt", "roleId", "roleName", "steamId", "syncedAt", "username"]);
});
