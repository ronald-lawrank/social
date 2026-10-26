"""lr — LawRank Studio commands. Each prints one JSON line (progress goes to stderr).

  lr setup [--home PATH]                 install this laptop's tools; link the shared Drive folder
  lr doctor                              check tools and the Drive folder
  lr client new <website> [--name N] [--package growth]
                                         scan the site -> brand profile, facts, logos, photos, brand board
  lr client show <client>                everything Claude needs about a client, in a few lines
  lr client list
  lr client set <client> key=value ...   direction=B, practice_area="Family law", package=authority ...
  lr client refresh <client>             after adding photos or a logo by hand: people, logo marks, brand board
  lr client import <old client folder>   bring a client over from the old LawRank template
  lr directions <client>                 test designs in 3-4 directions
  lr campaign new <client> [--name N] [--plan six-month] [--start 2026-11]
  lr campaign update <client> [--campaign C]   after a package change: add the posts it now includes
  lr build <client> [--campaign C] [--month N | --post ID[,ID]] [--sizes 4x5,1x1,9x16] [--force]
  lr video <client> [--campaign C] [--post ID]   MP4s for approved motion options
  lr package <client> [--campaign C] [--month N]
  lr library search "<text>" [--client C]
  lr templates [name[,name]] [--client C] list templates; with names: full slots, worked examples, icon names
                                         (motion --client C: only the families that suit the firm's practice)
"""
import argparse
import sys
import time
import traceback

from .util import LRError, emit


def _client(name):
    from . import store
    return store.find(name)


def cmd_setup(a):
    from . import tools
    return tools.setup(a.home, skip_models=a.skip_models)


def cmd_doctor(a):
    from . import tools
    return tools.doctor()


def cmd_client(a):
    from . import store
    if a.action == "new":
        from . import onboard
        return onboard.new_client(a.target, name=a.name, package=a.package, max_pages=a.pages, manual=a.manual)
    if a.action == "import":
        from . import legacy
        return legacy.import_folder(a.target, package=a.package)
    if a.action == "list":
        return {"ok": True, "clients": [{"name": c.name, "website": c.data.get("domain"), "status": c.data.get("status"),
                                         "direction": c.data.get("direction")} for c in store.all_clients()]}
    c = _client(a.target)
    if a.action in ("show", "set"):
        from . import summary
        return summary.client_summary(c) if a.action == "show" else summary.set_fields(c, a.pairs)
    if a.action in ("refresh", "photos"):
        from . import onboard
        return onboard.refresh(c, force=True)
    raise LRError(f"unknown action {a.action}")


def cmd_directions(a):
    from . import campaign
    return campaign.directions(_client(a.client), only=a.only)


def cmd_campaign(a):
    from . import campaign
    if a.action == "update":
        return campaign.update_campaign(_client(a.client), campaign=a.campaign, plan=a.plan)
    return campaign.new_campaign(_client(a.client), name=a.name, plan=a.plan, start=a.start)


def cmd_build(a):
    from . import build
    return build.build(_client(a.client), campaign=a.campaign, month=a.month, posts=a.post, sizes=a.sizes, force=a.force)


def cmd_video(a):
    from . import motion
    return motion.video(_client(a.client), campaign=a.campaign, posts=a.post)


def cmd_package(a):
    from . import deliver
    return deliver.package(_client(a.client), campaign=a.campaign, month=a.month)


def cmd_library(a):
    from . import library
    return library.search(a.text, client=a.client, limit=a.limit)


def cmd_templates(a):
    from . import templates
    if a.name:
        names = [n.strip() for n in a.name.split(",") if n.strip()]
        from . import motion
        if names[0] == "motion" or set(names) <= set(motion.FAMILIES):
            area = _client(a.client).data.get("practice_area") if a.client else None
            return {"ok": True, **motion.families_detail(None if names[0] == "motion" else names, area)}
        if len(names) == 1:
            return {"ok": True, **templates.detail(names[0])}
        out = [templates.detail(n) for n in names]
        icons = next((d.pop("icons") for d in out if "icons" in d), None)
        for d in out:
            d.pop("icons", None); d.pop("note", None)
        return {"ok": True, "templates": out, **({"icons": icons} if icons else {}),
                "note": "Example photo keys belong to a test client: use this client's keys from `lr client show`."}
    return {"ok": True, "templates": templates.catalog_summary() + [{"name": "motion", "format": "motion",
            "use_for": "Video / Motion slots (Authority): four animated families. `lr templates motion --client <client>` for their rules and examples."}],
            "next": "`lr templates <name>` gives a template's full slots and a worked example."}


def parser():
    ap = argparse.ArgumentParser(prog="lr", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("setup"); p.add_argument("--home"); p.add_argument("--skip-models", action="store_true"); p.set_defaults(fn=cmd_setup)
    sp.add_parser("doctor").set_defaults(fn=cmd_doctor)
    p = sp.add_parser("client"); p.add_argument("action", choices=["new", "show", "list", "set", "refresh", "photos", "import"]); p.add_argument("target", nargs="?")
    p.add_argument("pairs", nargs="*"); p.add_argument("--name"); p.add_argument("--package", default="growth"); p.add_argument("--pages", type=int, default=10)
    p.add_argument("--manual", action="store_true", help="site blocks scanning: create the folder and add the brand by hand")
    p.set_defaults(fn=cmd_client)
    p = sp.add_parser("directions"); p.add_argument("client"); p.add_argument("--only"); p.set_defaults(fn=cmd_directions)
    p = sp.add_parser("campaign"); p.add_argument("action", choices=["new", "update"]); p.add_argument("client"); p.add_argument("--name")
    p.add_argument("--campaign")
    p.add_argument("--plan", default="six-month"); p.add_argument("--start"); p.set_defaults(fn=cmd_campaign)
    p = sp.add_parser("build"); p.add_argument("client"); p.add_argument("--campaign"); p.add_argument("--month", type=int)
    p.add_argument("--post"); p.add_argument("--sizes"); p.add_argument("--force", action="store_true"); p.set_defaults(fn=cmd_build)
    p = sp.add_parser("video"); p.add_argument("client"); p.add_argument("--campaign"); p.add_argument("--post")
    p.set_defaults(fn=cmd_video)
    p = sp.add_parser("package"); p.add_argument("client"); p.add_argument("--campaign"); p.add_argument("--month", type=int); p.set_defaults(fn=cmd_package)
    p = sp.add_parser("library"); p.add_argument("action", choices=["search"]); p.add_argument("text"); p.add_argument("--client")
    p.add_argument("--limit", type=int, default=8); p.set_defaults(fn=cmd_library)
    p = sp.add_parser("templates"); p.add_argument("name", nargs="?"); p.add_argument("--client"); p.set_defaults(fn=cmd_templates)
    return ap


def main(argv=None) -> int:
    a = parser().parse_args(argv)
    if a.cmd == "client" and a.action != "list" and not a.target:
        emit({"ok": False, "error": "Which client?", "fix": "lr client show <firm name or website>"}); return 1
    t0 = time.time()
    try:
        res = a.fn(a) or {}
        res.setdefault("ok", True)
        res["seconds"] = round(time.time() - t0, 1)
        emit(res)
        return 0 if res["ok"] else 1
    except LRError as e:
        emit({"ok": False, "error": str(e), **({"fix": e.fix} if e.fix else {}), **e.extra}); return 1
    except KeyboardInterrupt:
        emit({"ok": False, "error": "stopped"}); return 130
    except Exception as e:                         # unexpected: a plain message for the person, the details in a log
        import os
        from .util import log_error
        logf = log_error(e, f"lr {a.cmd}")
        detail = traceback.format_exc()[-1500:] if os.environ.get("LR_DEBUG") else None
        emit({"ok": False, "error": f"Something unexpected went wrong during `lr {a.cmd}` ({type(e).__name__}: {str(e)[:160]}).",
              "fix": "Work saved before this point is kept. Try the same command once more; if it happens again, carry on with "
                     "other work and tell the studio maintainer" + (f" (details are in {logf})" if logf else "") + ".",
              **({"log": logf} if logf else {}), **({"trace": detail} if detail else {})})
        return 2


if __name__ == "__main__":
    sys.exit(main())
