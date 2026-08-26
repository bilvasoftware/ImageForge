using Microsoft.AspNetCore.Mvc;

namespace ImageForge.Controllers
{
    public class AboutController : Controller
    {
        [HttpGet]
        public IActionResult Index()
        {
            return View();
        }
    }
}